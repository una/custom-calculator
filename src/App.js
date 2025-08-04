import React, { useState, useEffect, useCallback } from 'react';
import * as math from 'mathjs';
import { Card, Heading, Button, Flex, Box, Tabs, Dialog, Text } from '@radix-ui/themes';
import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import ChainResult from './components/ChainResult';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [activeTab, setActiveTab] = useState('use');
  const [authView, setAuthView] = useState('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFunction, setSelectedFunction] = useState(null);

  const allTags = [...new Set(functions.flatMap(f => f.definition.settings?.tags || []))];

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
    const endpoint = isUpdating ? `/api/functions?id=${funcData.id}` : '/api/functions';
    const method = isUpdating ? 'PUT' : 'POST';
  
    // The funcData now includes subFunctions and settings
    const definition = { ...funcData };
  
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
        setEditingFunction(null);
        setActiveTab('use');
        setSuccessMessage(`Function "${funcData.name}" has been ${isUpdating ? 'updated' : 'created'} successfully.`);
      } else {
        console.error('Failed to save function');
      }
    } catch (error) {
      console.error('Error saving function:', error);
    }
  }, [token, fetchFunctions]);

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
      const { subFunctions, expression } = funcToRun;
      let currentScope = { ...initialValues };
      let resultsToDisplay = [];
      let processedExpression = expression;
      const { settings } = funcToRun;
  
      if (subFunctions && subFunctions.length > 0) {
        const subFuncMap = new Map(subFunctions.map(sf => [sf.name, sf]));
        const executionOrder = [];
        const visited = new Set();
        const visiting = new Set();
  
        function visit(name) {
          if (!subFuncMap.has(name)) return;
          if (visited.has(name)) return;
          if (visiting.has(name)) throw new Error(`Circular dependency detected in sub-functions involving "${name}"`);
          
          visiting.add(name);
          
          const subFunc = subFuncMap.get(name);
          const dependencies = (subFunc.expression.match(/\{(.+?)\}/g) || [])
            .map(m => m.slice(1, -1));
            
          dependencies.forEach(dep => visit(dep));
          
          visiting.delete(name);
          visited.add(name);
          executionOrder.push(subFunc);
        }
  
        subFunctions.forEach(sf => visit(sf.name));
  
        executionOrder.forEach(subFunc => {
          let subFuncProcessedExpression = subFunc.expression;
          
          // Replace placeholders with results from other sub-functions
          const dependencies = (subFunc.expression.match(/\{(.+?)\}/g) || [])
            .map(m => m.slice(1, -1));
          
          dependencies.forEach(depName => {
            if (currentScope.hasOwnProperty(depName)) {
              subFuncProcessedExpression = subFuncProcessedExpression.split(`{${depName}}`).join(currentScope[depName]);
            }
          });

          // Manually replace variables that start with @
          for (const key in currentScope) {
            if (key.startsWith('@')) {
              const value = currentScope[key];
              const regex = new RegExp(`\\${key}`, 'g');
              subFuncProcessedExpression = subFuncProcessedExpression.replace(regex, value);
            }
          }

          let subFuncResult = math.evaluate(subFuncProcessedExpression, currentScope);
          const decimalPlaces = settings?.decimalPlaces === '' ? 4 : settings?.decimalPlaces ?? 4;
          if (typeof subFuncResult === 'number') {
            subFuncResult = parseFloat(subFuncResult.toFixed(decimalPlaces));
          }
          resultsToDisplay.push({ name: `${funcToRun.name} -> ${subFunc.name}`, result: subFuncResult });
          currentScope[subFunc.name] = subFuncResult;
          processedExpression = processedExpression.split(`{${subFunc.name}}`).join(subFuncResult);
        });
      }
      
      // Manually replace variables that start with @
      for (const key in currentScope) {
        if (key.startsWith('@')) {
          const value = currentScope[key];
          const regex = new RegExp(`\\${key}`, 'g');
          processedExpression = processedExpression.replace(regex, value);
        }
      }
  
      let finalResult = math.evaluate(processedExpression, currentScope);
      const decimalPlaces = settings?.decimalPlaces === '' ? 4 : settings?.decimalPlaces ?? 4;
      if (typeof finalResult === 'number') {
        finalResult = parseFloat(finalResult.toFixed(decimalPlaces));
      }
      resultsToDisplay.push({ name: funcToRun.name, result: finalResult });
      setExecutionResults(resultsToDisplay);
  
    } catch (e) {
      console.error(e);
      setExecutionResults([{ name: 'Error', result: e.message }]);
    }
  }, []);

  const handleInitiateEdit = useCallback((funcToEdit) => {
    const originalFunction = functions.find(f => f.name === funcToEdit.name);
    if (originalFunction) {
      // The subFunctions are now part of the definition, so we can pass them directly
      setEditingFunction({ ...originalFunction, definition: { ...originalFunction.definition }});
    }
    window.scrollTo(0, 0);
  }, [functions]);

  const handleOpenSettingsFromEdit = () => {
    // This is a bit of a hack to open the settings dialog
    // It might be better to refactor this to have a single settings dialog
    // that can be opened from either the "use" or "edit" screen
    const useFunctionForm = document.querySelector('#use-function-form');
    if (useFunctionForm) {
      const settingsButton = useFunctionForm.querySelector('button[aria-label="Settings"]');
      if (settingsButton) {
        settingsButton.click();
      }
    }
  };
  
  const handleCancelEdit = useCallback(() => {
    setEditingFunction(null);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'use') {
      setSelectedFunction(null);
      setExecutionResults([]);
    }
  };

  const handleCalculateTabClick = () => {
    if (activeTab === 'use') {
      setSelectedFunction(null);
      setExecutionResults([]);
    }
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
              <Tabs.Trigger value="use" onClick={handleCalculateTabClick}>🧮 Calculate</Tabs.Trigger>
              <Tabs.Trigger value="create">➕ Create New Function</Tabs.Trigger>
            </Tabs.List>

            <Box pt="3">
              <Tabs.Content value="use">
                <UseFunctionForm
                  functions={functions.map(f => ({...f.definition, name: f.name, id: f.id}))}
                  onCalculate={handleExecution}
                  onEdit={handleInitiateEdit}
                  onDelete={handleDeleteFunction}
                  setExecutionResults={setExecutionResults}
                  onUpdateFunction={(updatedFunc) => handleSaveOrUpdateFunction(updatedFunc, true)}
                  allTags={allTags}
                  selectedFunction={selectedFunction}
                  setSelectedFunction={setSelectedFunction}
                />
              </Tabs.Content>

              <Tabs.Content value="create">
                <CreateFunctionForm 
                  onSaveOrUpdate={handleSaveOrUpdateFunction} 
                  editingFunction={null}
                  onCancelEdit={() => setActiveTab('use')}
                  functions={functions.map(f => ({...f.definition, name: f.name}))}
                  allTags={allTags}
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
              editingFunction={editingFunction ? {...editingFunction.definition, name: editingFunction.name, id: editingFunction.id} : null} 
              onCancelEdit={handleCancelEdit}
              functions={functions.map(f => ({...f.definition, name: f.name}))}
              onDelete={handleDeleteFunction}
              allTags={allTags}
              onOpenSettings={handleOpenSettingsFromEdit}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Card>
    </div>
  );
}

export default App;
