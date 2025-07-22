import React, { useState, useEffect, useCallback } from 'react';
import * as math from 'mathjs';
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
    setActiveTab('create');
    window.scrollTo(0, 0);
  }, [functions]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingFunction(null);
    setActiveTab('use');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExecutionResults([]);
  };

  if (!token) {
    return (
      <div className="App">
        <h1>Custom Calculator</h1>
        {authView === 'login' ? (
          <div className="form-section">
            <Login setToken={handleSetToken} />
            <p>Don't have an account? <button onClick={() => setAuthView('signup')}>Signup</button></p>
          </div>
        ) : (
          <div className="form-section">
            <Signup />
            <p>Already have an account? <button onClick={() => setAuthView('login')}>Login</button></p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Custom Calculator</h1>
      <button onClick={handleLogout}>Logout</button>
      
      <div className="tab-navigation">
        <button className={`tab-button ${activeTab === 'use' ? 'active' : ''}`} onClick={() => handleTabChange('use')}>
          Use Functions
        </button>
        <button className={`tab-button ${activeTab === 'create' ? 'active' : ''}`} onClick={() => handleTabChange('create')}>
          {editingFunction ? 'Edit Function' : 'Create New Function'}
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'use' && (
          <UseFunctionForm 
            functions={functions.map(f => ({...f.definition, name: f.name}))} 
            onCalculate={handleExecution}
            onEdit={handleInitiateEdit}
            onDelete={handleDeleteFunction}
          />
        )}
        {activeTab === 'create' && (
          <CreateFunctionForm 
            onSaveOrUpdate={handleSaveOrUpdateFunction} 
            editingFunction={editingFunction ? {...editingFunction.definition, name: editingFunction.name} : null} 
            onCancelEdit={handleCancelEdit}
            functions={functions.map(f => ({...f.definition, name: f.name}))}
          />
        )}
      </div>

      <ChainResult results={executionResults} />
    </div>
  );
}

export default App;
