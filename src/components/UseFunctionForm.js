import React, { useState, useEffect, useMemo } from 'react';

function UseFunctionForm({ functions, onCalculate, onEdit, onDelete }) {
  const [selectedFuncName, setSelectedFuncName] = useState('');
  const [variableValues, setVariableValues] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for collapsing the list

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
      return currentFunction.variables.split(',').map(v => v.trim());
    }
  }, [currentFunction, functions]);

  useEffect(() => {
    setVariableValues({});
    onCalculate(null);
    // Collapse the list whenever a new function is selected
    if (selectedFuncName) {
      setIsCollapsed(true);
    }
  }, [selectedFuncName, onCalculate]);

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
      setIsCollapsed(false); // Expand list after deletion
    }
  };

  const handleFunctionSelect = (name) => {
    setSelectedFuncName(name);
    setIsCollapsed(true); // Collapse on select
  };

  return (
    <div className="form-section">
      <h2>Use a Function</h2>
      <div className="form-group">
        <label>Select Function to Run</label>
        <div className="function-list-container">
          {/* Conditionally render the full list or the selected item */}
          {isCollapsed && currentFunction ? (
            <div className="selected-function-display">
              <button 
                className="function-list-item selected"
                disabled
              >
                {currentFunction.name} {currentFunction.type === 'chain' && <span className="chain-indicator">[Chain] ⛓️</span>}
              </button>
              <button className="change-btn" onClick={() => setIsCollapsed(false)}>Change</button>
            </div>
          ) : (
            <div className="function-list">
              {functions.length > 0 ? (
                functions.map((func) => (
                  <button 
                    key={func.name} 
                    onClick={() => handleFunctionSelect(func.name)}
                    className="function-list-item"
                  >
                    {func.name} {func.type === 'chain' && <span className="chain-indicator">[Chain] ⛓️</span>}
                  </button>
                ))
              ) : (
                <p className="no-functions-message">No functions saved yet. Create one above to get started.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {currentFunction && (
        <div className="function-details">
          {currentFunction.notes && (
            <div className="function-notes"><p>{currentFunction.notes}</p></div>
          )}
          {currentFunction.type === 'single' && (
             <div className="function-reference"><strong>Formula:</strong> <code>{currentFunction.expression}</code></div>
          )}
           {currentFunction.type === 'chain' && (
             <div className="function-reference"><strong>Type:</strong> Chained Function</div>
          )}
          
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
             {initialVariables.length === 0 && !currentFunction.variables && <p>No initial variables required for this function.</p>}
          </div>

          <div className="form-actions-secondary">
            <button className="edit-btn" onClick={() => onEdit(currentFunction)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteClick(currentFunction.name)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UseFunctionForm;