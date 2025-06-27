import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';

import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import CalculationChain from './components/CalculationChain';
import ChainInput from './components/ChainInput';
import ChainResult from './components/ChainResult';
import './App.css';

function App() {
  const [functions, setFunctions] = useState([]);
  const [editingFunction, setEditingFunction] = useState(null);
  
  const [calculationChain, setCalculationChain] = useState([]);
  const [chainResults, setChainResults] = useState([]);

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
  
  // --- Chain Management ---
  const handleAddToChain = (func) => {
    setCalculationChain(prev => [...prev, func]);
    setChainResults([]);
  };

  const handleRemoveFromChain = (indexToRemove) => {
    setCalculationChain(prev => prev.filter((_, index) => index !== indexToRemove));
    setChainResults([]);
  };

  const handleClearChain = () => {
    setCalculationChain([]);
    setChainResults([]);
  };

  // --- NEW: Handler for single function calculations ---
  const handleSingleCalculation = (func, variableValues) => {
    try {
      // We can display the single result using our existing chain result component
      const result = math.evaluate(func.expression, variableValues);
      setChainResults([{ name: func.name, result }]);
      // Also clear the main chain if a single calculation is run
      setCalculationChain([]);
    } catch (e) {
      alert(`Error during calculation: ${e.message}`);
      setChainResults([]);
    }
  };

  // --- Core Chained Calculation Logic ---
  const handleChainCalculation = (initialVariableValues) => {
    const results = [];
    let currentScope = { ...initialVariableValues };
    
    try {
      for (const func of calculationChain) {
        const result = math.evaluate(func.expression, currentScope);
        const resultKey = `resultOf${func.name.replace(/\s/g, '')}`;
        
        results.push({ name: func.name, result });
        currentScope[resultKey] = result;
      }
      setChainResults(results);
    } catch (e) {
      alert(`Error during calculation: ${e.message}`);
      setChainResults([]);
    }
  };

  // --- Edit/Save/Delete Handlers (no changes) ---
  const handleSaveOrUpdateFunction = (funcData, isUpdating) => {
    if (isUpdating) {
      setFunctions(functions.map(f => (f.name === funcData.name ? funcData : f)));
    } else {
      if (functions.some(f => f.name === funcData.name)) {
        alert("A function with this name already exists.");
        return;
      }
      setFunctions([...functions, funcData]);
    }
    setEditingFunction(null);
  };

  const handleInitiateEdit = (funcToEdit) => {
    setEditingFunction(funcToEdit);
    window.scrollTo(0, 0);
  };
  
  const handleCancelEdit = () => {
    setEditingFunction(null);
  };

  const handleDeleteFunction = (functionName) => {
    if (editingFunction && editingFunction.name === functionName) {
      setEditingFunction(null);
    }
    setFunctions(functions.filter(f => f.name !== functionName));
  };


  return (
    <div className="App">
      <h1>Custom Calculator</h1>
      {/* The `onDelete` and `onEdit` props were added to CreateFunctionForm previously, let's remove them to avoid confusion */}
      <CreateFunctionForm 
        onSaveOrUpdate={handleSaveOrUpdateFunction} 
        editingFunction={editingFunction} 
        onCancelEdit={handleCancelEdit}
      />
      {/* Pass both the single calculation and chain handlers */}
      <UseFunctionForm 
        functions={functions} 
        onAddToChain={handleAddToChain}
        onCalculate={handleSingleCalculation}
        onEdit={handleInitiateEdit}
        onDelete={handleDeleteFunction}
      />
      
      <CalculationChain 
        chain={calculationChain} 
        onRemove={handleRemoveFromChain} 
        onClear={handleClearChain} 
      />

      <ChainInput chain={calculationChain} onCalculate={handleChainCalculation} />

      <ChainResult results={chainResults} />
    </div>
  );
}

export default App;