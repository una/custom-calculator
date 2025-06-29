import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as math from 'mathjs';

import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import ChainResult from './components/ChainResult';
import './App.css';

function App() {
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [activeTab, setActiveTab] = useState('use');
  const isInitialMount = useRef(true);

  // Load from localStorage
  useEffect(() => {
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) setFunctions(JSON.parse(savedFunctions));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('customFunctions', JSON.stringify(functions));
    }
  }, [functions]);

  // --- NEW: useEffect to clear results when switching tabs ---
  useEffect(() => {
    // If the active tab is not the "Use" tab, clear any previous results.
    if (activeTab !== 'use') {
      setExecutionResults([]);
    }
  }, [activeTab]);


  // --- All other handlers and logic remain the same ---
  
  const handleExecution = useCallback((funcToRun, initialValues) => {
    if (!funcToRun || !initialValues) {
      setExecutionResults([]);
      return;
    }
    try {
      if (funcToRun.type === 'chain') {
        const results = [];
        let currentScope = { ...initialValues };
        for (const funcName of funcToRun.chain) {
          const func = functions.find(f => f.name === funcName);
          if (!func) throw new Error(`Chained function "${funcName}" not found.`);
          const result = math.evaluate(func.expression, currentScope);
          const resultKey = `resultOf${func.name.replace(/\s/g, '')}`;
          results.push({ name: func.name, result });
          currentScope[resultKey] = result;
        }
        setExecutionResults(results);
      } else {
        const result = math.evaluate(funcToRun.expression, initialValues);
        setExecutionResults([{ name: funcToRun.name, result }]);
      }
    } catch (e) {
      console.error(e);
      setExecutionResults([]);
    }
  }, [functions]);

  const handleSaveOrUpdateFunction = useCallback((funcData, isUpdating) => {
    if (isUpdating) {
      setFunctions(prev => prev.map(f => (f.name === funcData.name ? funcData : f)));
    } else {
      setFunctions(prev => {
        if (prev.some(f => f.name === funcData.name)) {
          alert("A function with this name already exists.");
          return prev;
        }
        return [...prev, funcData];
      });
    }
    setEditingFunction(null);
    setActiveTab('use');
  }, []);

  const handleInitiateEdit = useCallback((funcToEdit) => {
    setEditingFunction(funcToEdit);
    setActiveTab('create');
    window.scrollTo(0, 0);
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingFunction(null);
    setActiveTab('use');
  }, []);

  const handleDeleteFunction = useCallback((functionName) => {
    setEditingFunction(prev => (prev && prev.name === functionName ? null : prev));
    setFunctions(prev => prev.filter(f => f.name !== functionName));
  }, []);

  return (
    <div className="App">
      <h1>Custom Calculator</h1>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'use' ? 'active' : ''}`}
          onClick={() => setActiveTab('use')}
        >
          Use Functions
        </button>
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          {editingFunction ? 'Edit Function' : 'Create New Function'}
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'use' && (
          <UseFunctionForm 
            functions={functions} 
            onCalculate={handleExecution}
            onEdit={handleInitiateEdit}
            onDelete={handleDeleteFunction}
          />
        )}
        {activeTab === 'create' && (
          <CreateFunctionForm 
            onSaveOrUpdate={handleSaveOrUpdateFunction} 
            editingFunction={editingFunction} 
            onCancelEdit={handleCancelEdit}
            functions={functions}
          />
        )}
      </div>

      <ChainResult results={executionResults} />
    </div>
  );
}

export default App;