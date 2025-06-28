import React, { useState, useEffect, useMemo } from 'react';

function UseFunctionForm({ functions, onCalculate, onEdit, onDelete }) {
  const [selectedFuncName, setSelectedFuncName] = useState('');
  const [variableValues, setVariableValues] = useState({});

  const currentFunction = useMemo(() => 
    functions.find(f => f.name === selectedFuncName),
    [selectedFuncName, functions]
  );

  const initialVariables = useMemo(() => {
    if (!currentFunction) return [];
    
    if (currentFunction.type === 'chain') {
      const allVars = new Set();
      const generatedResults = new Set();
      
      currentFunction.chain.forEach(funcName => {
        const func = functions.find(f => f.name === funcName);
        if (!func) return;
        
        func.variables.split(',').map(v => v.trim()).forEach(v => allVars.add(v));
        generatedResults.add(`resultOf${func.name.replace(/\s/g, '')}`);
      });

      return [...allVars].filter(v => !generatedResults.has(v));
    } else {
      // For single functions, all variables are initial variables
      return currentFunction.variables.split(',').map(v => v.trim());
    }
  }, [currentFunction, functions]);

  // Reset state when selection changes
  useEffect(() => {
    setVariableValues({});
    onCalculate(null);
  }, [selectedFuncName, onCalculate]);

  // useEffect for live calculations
  useEffect(() => {
    if (!currentFunction) return;

    const allInputsFilled = initialVariables.every(v => variableValues[v] && variableValues[v] !== '');

    if (allInputsFilled) {
      const scope = {};
      let allInputsValid = true;
      for (const v of initialVariables) {
        scope[v] = parseFloat(variableValues[v]);
        if (isNaN(scope[v])) {
          allInputsValid = false;
          break;
        }
      }
      if (allInputsValid) {
        onCalculate(currentFunction, scope);
      }
    } else {
      onCalculate(null);
    }
  }, [variableValues, currentFunction, initialVariables, onCalculate]);

  const handleVariableChange = (varName, value) => {
    setVariableValues(prev => ({ ...prev, [varName]: value }));
  };
  
  const handleDeleteClick = (funcName) => {
    if (window.confirm(`Are you sure you want to delete "${funcName}"?`)) {
      onDelete(funcName);
      setSelectedFuncName('');
    }
  };

  return (
    <div className="form-section">
      <h2>Use a Function</h2>
      <div className="form-group">
        <label>Select Function to Run</label>
        <select value={selectedFuncName} onChange={e => setSelectedFuncName(e.target.value)}>
          <option value="">-- Select a function --</option>
          {functions.map((func) => (
            <option key={func.name} value={func.name}>{func.name}</option>
          ))}
        </select>
      </div>

      {currentFunction && (
        <>
          {/* Notes and Formula are shown for both types */}
          {currentFunction.notes && (
            <div className="function-notes"><p>{currentFunction.notes}</p></div>
          )}
          {currentFunction.type === 'single' && (
             <div className="function-reference"><strong>Formula:</strong> <code>{currentFunction.expression}</code></div>
          )}
           {currentFunction.type === 'chain' && (
             <div className="function-reference"><strong>Type:</strong> Chained Function</div>
          )}
          
          {/* Render the required inputs */}
          <div className="variable-inputs">
            <h4>Enter Variable Values:</h4>
            {initialVariables.map((varName) => (
              <div className="form-group" key={varName}>
                <label>{varName}</label>
                <input
                  type="number"
                  value={variableValues[varName] || ''}
                  onChange={(e) => handleVariableChange(varName, e.target.value)}
                />
              </div>
            ))}
             {initialVariables.length === 0 && <p>No initial variables required for this function.</p>}
          </div>

          <div className="form-actions-secondary">
            <button className="edit-btn" onClick={() => onEdit(currentFunction)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteClick(currentFunction.name)}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

export default UseFunctionForm;