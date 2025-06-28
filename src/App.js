import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as math from 'mathjs';

import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import ChainResult from './components/ChainResult'; // We still need this!
import './App.css';

function App() {
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  const [executionResults, setExecutionResults] = useState([]); // Renamed for clarity
  const isInitialMount = useRef(true);

  // Load/Save from localStorage
  useEffect(() => {
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) setFunctions(JSON.parse(savedFunctions));
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('customFunctions', JSON.stringify(functions));
    }
  }, [functions]);

  // --- Main Calculation Handler ---
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
      } else { // Single function
        const result = math.evaluate(funcToRun.expression, initialValues);
        setExecutionResults([{ name: funcToRun.name, result }]);
      }
    } catch (e) {
      console.error(e);
      setExecutionResults([]);
    }
  }, [functions]);

  // --- Edit/Save/Delete Handlers ---
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
  }, []);

  const handleInitiateEdit = useCallback((funcToEdit) => {
    setEditingFunction(funcToEdit);
    window.scrollTo(0, 0);
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingFunction(null);
  }, []);

  const handleDeleteFunction = useCallback((functionName) => {
    setEditingFunction(prev => (prev && prev.name === functionName ? null : prev));
    setFunctions(prev => prev.filter(f => f.name !== functionName));
  }, []);

  return (
    <div className="App">
      <h1>Custom Calculator</h1>
      <CreateFunctionForm 
        onSaveOrUpdate={handleSaveOrUpdateFunction} 
        editingFunction={editingFunction} 
        onCancelEdit={handleCancelEdit}
        functions={functions} // Pass all functions for the chain builder dropdown
      />
      <UseFunctionForm 
        functions={functions} 
        onCalculate={handleExecution} // Renamed prop for clarity
        onEdit={handleInitiateEdit}
        onDelete={handleDeleteFunction}
      />
      <ChainResult results={executionResults} />
    </div>
  );
}

export default App;