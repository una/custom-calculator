import React, { useState, useEffect, useCallback } from 'react';
import * as math from 'mathjs';
import { Card, Heading, Button, Flex, Box, Tabs, Dialog } from '@radix-ui/themes';
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

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: funcData.name, definition: funcData }),
      });

      if (response.ok) {
        fetchFunctions();
        setEditingFunction(null);
        setActiveTab('use');
      } else {
        console.error('Failed to save function');
      }
    } catch (error) {
      console.error('Error saving function:', error);
    }
  }, [token, fetchFunctions]);

  const handleDeleteFunction = useCallback(async (functionName) => {
    try {
      const response = await fetch(`/api/functions?name=${functionName}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchFunctions();
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
      const { type, expression, nestedFunction } = funcToRun;
      let currentScope = { ...initialValues };
      let finalResult;
      let resultsToDisplay = [];

      if (type === 'nested' && nestedFunction) {
        const funcToNest = functions.find(f => f.name === nestedFunction);
        if (!funcToNest) throw new Error(`Nested function "${nestedFunction}" not found.`);
        
        // Execute the nested function first
        const nestedResult = math.evaluate(funcToNest.definition.expression, currentScope);
        resultsToDisplay.push({ name: funcToNest.name, result: nestedResult });
        
        // Add the result to the scope for the outer function
        currentScope.nestedResult = nestedResult;
      }

      // Execute the main function
      finalResult = math.evaluate(expression, currentScope);
      resultsToDisplay.push({ name: funcToRun.name, result: finalResult });

      setExecutionResults(resultsToDisplay);

    } catch (e) {
      console.error(e);
      setExecutionResults([]);
    }
  }, [functions]);

  const handleInitiateEdit = useCallback((funcToEdit) => {
    const originalFunction = functions.find(f => f.name === funcToEdit.name);
    setEditingFunction(originalFunction);
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
              <Tabs.Trigger value="use">Use Functions</Tabs.Trigger>
              <Tabs.Trigger value="create">Create New Function</Tabs.Trigger>
            </Tabs.List>

            <Box pt="3">
              <Tabs.Content value="use">
                <UseFunctionForm 
                  functions={functions.map(f => ({...f.definition, name: f.name}))} 
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

        <ChainResult results={executionResults} />

        <Dialog.Root open={!!editingFunction} onOpenChange={(isOpen) => !isOpen && setEditingFunction(null)}>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Edit Function</Dialog.Title>
            <CreateFunctionForm 
              onSaveOrUpdate={handleSaveOrUpdateFunction} 
              editingFunction={editingFunction ? {...editingFunction.definition, name: editingFunction.name} : null} 
              onCancelEdit={handleCancelEdit}
              functions={functions.map(f => ({...f.definition, name: f.name}))}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Card>
    </div>
  );
}

export default App;
