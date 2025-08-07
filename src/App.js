import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as math from 'mathjs';
import { Card, Heading, Button, Flex, Box, Tabs, Dialog, Text } from '@radix-ui/themes';
import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import ChainResult from './components/ChainResult';
import Login from './components/Login';
import Signup from './components/Signup';
import Toast from './components/Toast';
import FunctionSettingsDialog from './components/FunctionSettingsDialog';
import Settings from './components/Settings';
import HamburgerMenu from './components/HamburgerMenu';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('main');
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [executionResults, setExecutionResults] = useState([]);
  const [activeTab, setActiveTab] = useState('use');
  const [authView, setAuthView] = useState('login');
  const [toastInfo, setToastInfo] = useState({ open: false, title: '', message: '' });
  const [selectedFunction, setSelectedFunction] = useState(null);
  const fileInputRef = useRef(null);

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
    if (token && !user) {
      // Fetch user data if token exists but user is not set (e.g., on page refresh)
      const fetchUser = async () => {
        try {
          // This assumes you have an endpoint to get user data from a token
          // You might need to create this endpoint
          const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          handleLogout();
        }
      };
      fetchUser();
    }
    fetchFunctions();
  }, [token, user, fetchFunctions]);

  const handleSetToken = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setFunctions([]);
    setCurrentView('main');
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
        setToastInfo({
          open: true,
          title: 'Success',
          message: `Function "${funcData.name}" has been ${isUpdating ? 'updated' : 'created'} successfully.`,
        });
      } else {
        console.error('Failed to save function');
      }
    } catch (error) {
      console.error('Error saving function:', error);
    }
  }, [token, fetchFunctions]);

  const handleDeleteFunction = useCallback(async (functionId) => {
    const funcToDelete = functions.find(f => f.id === functionId);
    try {
      const response = await fetch(`/api/functions?id=${functionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchFunctions();
        setEditingFunction(null);
        setActiveTab('use');
        setSelectedFunction(null);
        setToastInfo({
          open: true,
          title: 'Success',
          message: `Function "${funcToDelete?.name}" has been deleted successfully.`,
        });
      } else {
        console.error('Failed to delete function');
      }
    } catch (error) {
      console.error('Error deleting function:', error);
    }
  }, [token, fetchFunctions, functions]);

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
          const dependencies = (subFunc.expression.match(/\{([\w@.-]+)\}/g) || [])
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
          const dependencies = (subFunc.expression.match(/\{([\w@.-]+)\}/g) || [])
            .map(m => m.slice(1, -1));
          
          dependencies.forEach(depName => {
            if (currentScope.hasOwnProperty(depName)) {
              subFuncProcessedExpression = subFuncProcessedExpression.split(`{${depName}}`).join(currentScope[depName]);
            }
          });


          let subFuncResult = math.evaluate(subFuncProcessedExpression, currentScope);
          const decimalPlaces = settings?.decimalPlaces === '' ? 4 : settings?.decimalPlaces ?? 4;
          if (typeof subFuncResult === 'number') {
            subFuncResult = parseFloat(subFuncResult.toFixed(decimalPlaces));
          }
          if (settings?.subfunctionVisibility?.[subFunc.name] !== false) {
            resultsToDisplay.push({ name: `${funcToRun.name} -> ${subFunc.name}`, result: subFuncResult });
          }
          currentScope[subFunc.name] = subFuncResult;
          processedExpression = processedExpression.split(`{${subFunc.name}}`).join(subFuncResult);
        });
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

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
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

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      try {
        const { id, ...importedFunc } = JSON.parse(e.target.result);
        handleSaveOrUpdateFunction(importedFunc, false);
      } catch (error) {
        console.error("Error parsing imported file:", error);
        setToastInfo({
          open: true,
          title: 'Import Error',
          message: 'Could not parse the selected file. Please ensure it is a valid exported function JSON file.',
        });
      }
    };
    // Reset the input value to allow re-importing the same file
    event.target.value = null;
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
              <Login setToken={handleSetToken} setUser={setUser} />
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

  if (currentView === 'settings') {
    return (
      <div className="App">
        <Card>
          <Flex justify="between" align="center">
            <Heading>Settings</Heading>
            <Button onClick={() => setCurrentView('main')}>Back to App</Button>
          </Flex>
          <Box mt="4">
            <Settings token={token} user={user} setUser={setUser} />
          </Box>
        </Card>
      </div>
    );
  }

  return (
    <div className="App">
      <Card>
        <Flex justify="between" align="center">
          <Heading>Custom Calculator</Heading>
          <HamburgerMenu
            onSettingsClick={() => setCurrentView('settings')}
            onLogoutClick={handleLogout}
          />
        </Flex>
        
        <Box mt="4">
          <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
            <Tabs.List>
              <Tabs.Trigger value="use" onClick={handleCalculateTabClick}><span className="material-symbols-outlined">calculate</span> Calculate</Tabs.Trigger>
              <Tabs.Trigger value="create"><span className="material-symbols-outlined">add</span> Create New Function</Tabs.Trigger>
              <Button variant="ghost" onClick={handleImportClick}>
                <span className="material-symbols-outlined">upload</span> Import
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
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

        <ChainResult results={executionResults} />

        <Toast
          open={toastInfo.open}
          setOpen={(isOpen) => setToastInfo(prev => ({ ...prev, open: isOpen }))}
          title={toastInfo.title}
          message={toastInfo.message}
        />

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
              onOpenSettings={handleOpenSettings}
            />
          </Dialog.Content>
        </Dialog.Root>

        {editingFunction && (
          <FunctionSettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            functionData={editingFunction ? {...editingFunction.definition, name: editingFunction.name, id: editingFunction.id} : null}
            onSave={(updatedSettings) => {
              const updatedFunc = {
                ...editingFunction.definition,
                name: editingFunction.name,
                id: editingFunction.id,
                settings: {
                  ...updatedSettings,
                  decimalPlaces: isNaN(updatedSettings.decimalPlaces) ? 4 : updatedSettings.decimalPlaces,
                },
              };
              handleSaveOrUpdateFunction(updatedFunc, true);
              setIsSettingsOpen(false);
            }}
            allTags={allTags}
          />
        )}
      </Card>
    </div>
  );
}

export default App;
