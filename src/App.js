import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Load from localStorage (no changes)
  useEffect(() => {
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) setFunctions(JSON.parse(savedFunctions));
  }, []);

  // Save to localStorage (no changes)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('customFunctions', JSON.stringify(functions));
    }
  }, [functions]);

  // --- Handlers wrapped in useCallback ---

  const handleAddToChain = useCallback((func) => {
    setCalculationChain(prev => [...prev, func]);
    setChainResults([]);
  }, []);

  const handleRemoveFromChain = useCallback((indexToRemove) => {
    setCalculationChain(prev => prev.filter((_, index) => index !== indexToRemove));
    setChainResults([]);
  }, []);

  const handleClearChain = useCallback(() => {
    setCalculationChain([]);
    setChainResults([]);
  }, []);

  // --- FIXED: Single calculation handler ---
  const handleSingleCalculation = useCallback((func, variableValues) => {
    // This function should only affect the results display, not the chain.
    if (!func || !variableValues) {
      setChainResults([]);
      return;
    }
    try {
      const result = math.evaluate(func.expression, variableValues);
      setChainResults([{ name: func.name, result }]);
      // setCalculationChain([]); // <<< THIS LINE WAS THE BUG AND HAS BEEN REMOVED.
    } catch (e) {
      setChainResults([]);
    }
  }, []);

  const handleChainCalculation = useCallback((initialVariableValues) => {
    if (!initialVariableValues) {
      setChainResults([]);
      return;
    }
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
      setChainResults([]);
    }
  }, [calculationChain]);

  // ... (All other handlers for Edit/Save/Delete remain the same) ...
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
      />
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