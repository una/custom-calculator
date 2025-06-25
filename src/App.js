import React, { useState, useEffect, useRef } from 'react';
import CreateFunctionForm from './components/CreateFunctionForm';
import UseFunctionForm from './components/UseFunctionForm';
import './App.css';

function App() {
  const [functions, setFunctions] = useState([]);
  const [result, setResult] = useState(null);
  const [editingFunction, setEditingFunction] = useState(null); // State to track the function being edited

  const isInitialMount = useRef(true);

  // Load from localStorage (no changes here)
  useEffect(() => {
    try {
      const savedFunctions = localStorage.getItem('customFunctions');
      if (savedFunctions) {
        setFunctions(JSON.parse(savedFunctions));
      }
    } catch (error) {
      console.error("Failed to load functions from localStorage", error);
    }
  }, []);

  // Save to localStorage (no changes here)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      try {
        localStorage.setItem('customFunctions', JSON.stringify(functions));
      } catch (error) {
        console.error("Failed to save functions to localStorage", error);
      }
    }
  }, [functions]);

  // --- NEW: Handler to set the app to "edit mode" ---
  const handleInitiateEdit = (funcToEdit) => {
    setEditingFunction(funcToEdit);
    window.scrollTo(0, 0); // Scroll to top to see the edit form
  };

  // --- NEW: Handler to cancel edit mode ---
  const handleCancelEdit = () => {
    setEditingFunction(null);
  };

  // --- UPDATED: Now handles both creating and updating ---
  const handleSaveOrUpdateFunction = (funcData, isUpdating) => {
    if (isUpdating) {
      // Update existing function
      setFunctions(functions.map(f => (f.name === funcData.name ? funcData : f)));
    } else {
      // Add new function (check for duplicates first)
      if (functions.some(f => f.name === funcData.name)) {
        alert("A function with this name already exists.");
        return;
      }
      setFunctions([...functions, funcData]);
    }
    setEditingFunction(null); // Exit edit mode after action
  };

  // --- NEW: Handler to delete a function ---
  const handleDeleteFunction = (functionName) => {
    // If deleting the function that is currently being edited, exit edit mode
    if (editingFunction && editingFunction.name === functionName) {
      setEditingFunction(null);
    }
    setFunctions(functions.filter(f => f.name !== functionName));
  };

  const handleCalculate = (calcResult) => {
    setResult(calcResult);
  };

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
        onCalculate={handleCalculate}
        onEdit={handleInitiateEdit}
        onDelete={handleDeleteFunction}
      />
      {result !== null && (
        <div className="result">
          Result: {result}
        </div>
      )}
    </div>
  );
}

export default App;