import React, { useState, useEffect, useCallback } from 'react';
import * as math from 'mathjs';
import { Card, Heading, Button, Flex, Box, Tabs, Dialog, Text } from '@radix-ui/themes';
import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import ChainResult from './components/ChainResult';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const evaluateWithHyphens = (expression, scope) => {
  const sanitizedScope = {};
  for (const key in scope) {
    sanitizedScope[key.replace(/-/g, '_')] = scope[key];
  }

  // Protect subtraction operator by replacing it with a unique placeholder
  const protectedExpression = expression.replace(/\s-\s/g, ' __SUBTRACT__ ');

  // Now, replace all remaining hyphens (which should only be in variable names)
  const sanitizedExpression = protectedExpression.replace(/-/g, '_');

  // Restore the subtraction operator
  const finalExpression = sanitizedExpression.replace(/__SUBTRACT__/g, '-');

  return math.evaluate(finalExpression, sanitizedScope);
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [activeTab, setActiveTab] = useState('use');
  const [authView, setAuthView] = useState('login');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchFunctions = useCallback(async () => {
    if (token) {
      try {
        const response = await fetch('/api/functions', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFunctions(data.map(f => ({ ...f, definition: JSON.parse(f.definition) })));
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching functions:', error);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSetToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setFunctions([]);
  };

  const handleSaveOrUpdateFunction = useCallback(async (funcData, isUpdating) => {
    const endpoint = isUpdating ? `/api/functions?name=${funcData.name}` : '/api/functions';
    const method = isUpdating ? 'PUT' : 'POST';

    const definition = {
      ...funcData,
      nestedFunctions: funcData.nestedFunctions.map(f => f.value),
    };

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: funcData.name, definition }),
      });

      if (response.ok) {
        await fetchFunctions();
        if (isUpdating) {
          // After updating a function, find any parent functions and update their variables
          const parentFunctions = functions.filter(f => f.definition.nestedFunctions && f.definition.nestedFunctions.includes(funcData.name));
          for (const parentFunc of parentFunctions) {
            const nestedFuncs = parentFunc.definition.nestedFunctions;
            const allVars = new Set();
            nestedFuncs.forEach(nestedFuncName => {
              const func = functions.find(f => f.name === nestedFuncName);
              // get the updated function definition
              const updatedFunc = funcData.name === nestedFuncName ? definition : func.definition;
              if (updatedFunc && updatedFunc.variables) {
                updatedFunc.variables.split(',').forEach(v => allVars.add(v.trim()));
              }
            });
            const newVars = Array.from(allVars).join(', ');
            const updatedParentDef = { ...parentFunc.definition, variables: newVars };
            await fetch(`/api/functions?name=${parentFunc.name}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ name: parentFunc.name, definition: updatedParentDef }),
            });
          }
        }
        fetchFunctions();
        setEditingFunction(null);
        setActiveTab('use');
        setSuccessMessage(`Function "${funcData.name}" has been ${isUpdating ? 'updated' : 'created'} successfully.`);
      } else {
        console.error('Failed to save function');
      }
    } catch (error) {
      console.error('Error saving function:', error);
    }
  }, [token, fetchFunctions, functions]);

  const handleDeleteFunction = useCallback(async (functionId) => {
    try {
      const response = await fetch(`/api/functions?id=${functionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchFunctions();
        setEditingFunction(null); // Close the dialog
      } else {
        console.error('Failed to delete function');
      }
    } catch (error) {
      console.error('Error deleting function:', error);
    }
  }, [token, fetchFunctions]);

  const handleExecution = useCallback((funcToRun, initialValues) => {
    if (!funcToRun || !initialValues) {
      setExecutionResults([]);
      return;
    }
    try {
      const { nestedFunctions, expression } = funcToRun;
      let currentScope = { ...initialValues };
      let resultsToDisplay = [];
      let processedExpression = expression;

      const allNestedFunctions = [];
      if (funcToRun.nestedFunction) {
        allNestedFunctions.push(funcToRun.nestedFunction);
      }
      if (nestedFunctions) {
        allNestedFunctions.push(...nestedFunctions.map(f => typeof f === 'object' ? f.value : f));
      }

      if (allNestedFunctions.length > 0) {
        const allVars = new Set(funcToRun.variables.split(',').map(v => v.trim()));
        
        allNestedFunctions.forEach(nestedFuncName => {
          const funcToNest = functions.find(f => f.name === nestedFuncName);
          if (!funcToNest) throw new Error(`Nested function "${nestedFuncName}" not found.`);
          
          if (funcToNest.definition.variables) {
            funcToNest.definition.variables.split(',').forEach(v => allVars.add(v.trim()));
          }
        });

        allVars.forEach(v => {
          if (initialValues.hasOwnProperty(v)) {
            currentScope[v] = initialValues[v];
          }
        });

        allNestedFunctions.forEach(nestedFuncName => {
          const funcToNest = functions.find(f => f.name === nestedFuncName);
          if (!funcToNest) throw new Error(`Nested function "${nestedFuncName}" not found.`);
          
          const nestedScope = {};
          if (funcToNest.definition.variables) {
            const nestedVars = funcToNest.definition.variables.split(',').map(v => v.trim());
            nestedVars.forEach(v => {
              if (currentScope.hasOwnProperty(v)) {
                nestedScope[v] = currentScope[v];
              }
            });
          }

          const nestedResult = evaluateWithHyphens(funcToNest.definition.expression, nestedScope);
          resultsToDisplay.push({ name: funcToNest.name, result: nestedResult });
          
          // Add the result to the scope for the outer function
          currentScope[nestedFuncName] = nestedResult;
          if (funcToRun.nestedFunction === nestedFuncName) {
            currentScope.nestedResult = nestedResult;
          }
          
          // Replace the placeholder in the expression
          const placeholder = `{${nestedFuncName}}`;
          processedExpression = processedExpression.split(placeholder).join(nestedResult);
        });
      }

      // Execute the main function
      const finalResult = evaluateWithHyphens(processedExpression, currentScope);
      resultsToDisplay.push({ name: funcToRun.name, result: finalResult });

      setExecutionResults(resultsToDisplay);

    } catch (e) {
      console.error(e);
      setExecutionResults([]);
    }
  }, [functions]);

  const handleInitiateEdit = useCallback((funcToEdit) => {
    const originalFunction = functions.find(f => f.name === funcToEdit.name);
    if (originalFunction) {
      const nestedFunctionsWithOptions = (originalFunction.definition.nestedFunctions || []).map(name => {
        const func = functions.find(f => f.name === name);
        return { value: name, label: `${name} (${func.definition.variables})`, variables: func.definition.variables };
      });
      setEditingFunction({ ...originalFunction, definition: { ...originalFunction.definition, nestedFunctions: nestedFunctionsWithOptions }});
    }
    window.scrollTo(0, 0);
  }, [functions]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingFunction(null);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExecutionResults([]);
  };

  if (!token) {
    return (
      <div className="App">
        <Card>
          <Heading>Custom Calculator</Heading>
          {authView === 'login' ? (
            <Box mt="4">
              <Login setToken={handleSetToken} />
              <p>Don't have an account? <Button variant="ghost" onClick={() => setAuthView('signup')}>Signup</Button></p>
            </Box>
          ) : (
            <Box mt="4">
              <Signup />
              <p>Already have an account? <Button variant="ghost" onClick={() => setAuthView('login')}>Login</Button></p>
            </Box>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="App">
      <Card>
        <Flex justify="between" align="center">
          <Heading>Custom Calculator</Heading>
          <Button onClick={handleLogout}>Logout</Button>
        </Flex>
        
        <Box mt="4">
          <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
            <Tabs.List>
              <Tabs.Trigger value="use">🧮 Calculate</Tabs.Trigger>
              <Tabs.Trigger value="create">➕ Create New Function</Tabs.Trigger>
            </Tabs.List>

            <Box pt="3">
              <Tabs.Content value="use">
                <UseFunctionForm 
                  functions={functions.map(f => ({...f.definition, name: f.name, id: f.id}))} 
                  onCalculate={handleExecution}
                  onEdit={handleInitiateEdit}
                  onDelete={handleDeleteFunction}
                />
              </Tabs.Content>

              <Tabs.Content value="create">
                <CreateFunctionForm 
                  onSaveOrUpdate={handleSaveOrUpdateFunction} 
                  editingFunction={null}
                  onCancelEdit={() => setActiveTab('use')}
                  functions={functions.map(f => ({...f.definition, name: f.name}))}
                />
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Box>

        {successMessage && (
          <Box mt="4" p="3" style={{ background: 'var(--green-a2)', borderRadius: 'var(--radius-3)' }}>
            <Text color="green">{successMessage}</Text>
          </Box>
        )}

        <ChainResult results={executionResults} />

        <Dialog.Root open={!!editingFunction} onOpenChange={(isOpen) => !isOpen && setEditingFunction(null)}>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Edit Function</Dialog.Title>
            <CreateFunctionForm 
              onSaveOrUpdate={handleSaveOrUpdateFunction} 
              editingFunction={editingFunction ? {...editingFunction.definition, name: editingFunction.name} : null} 
              onCancelEdit={handleCancelEdit}
              functions={functions.map(f => ({...f.definition, name: f.name}))}
              onDelete={handleDeleteFunction}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Card>
    </div>
  );
}

export default App;
