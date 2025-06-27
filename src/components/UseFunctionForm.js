import React, { useState, useEffect } from 'react';

function UseFunctionForm({ functions, onCalculate, onAddToChain, onEdit, onDelete }) {
  const [selectedFuncName, setSelectedFuncName] = useState('');
  const [variableValues, setVariableValues] = useState({});

  const currentFunction = functions.find(f => f.name === selectedFuncName);

  // When the selected function changes, reset the variable inputs and clear results
  useEffect(() => {
    setVariableValues({});
    if (onCalculate) {
      onCalculate(null);
    }
  }, [selectedFuncName, onCalculate]);

  // useEffect for live calculations
  useEffect(() => {
    if (!currentFunction) return;

    const variables = currentFunction.variables.split(',').map(v => v.trim()).filter(v => !v.startsWith('resultOf'));
    const allInputsFilled = variables.every(v => variableValues[v] && variableValues[v] !== '');

    if (allInputsFilled) {
      const scope = {};
      let allInputsValid = true;
      for (const v of variables) {
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
  }, [variableValues, currentFunction, onCalculate]);

  
  const handleVariableChange = (varName, value) => {
    setVariableValues(prev => ({ ...prev, [varName]: value }));
  };
  
  const handleAddClick = () => {
    if (currentFunction) onAddToChain(currentFunction);
  };

  const handleDeleteClick = (funcName) => {
    if (window.confirm(`Are you sure you want to delete the function "${funcName}"?`)) {
        onDelete(funcName);
        setSelectedFuncName('');
    }
  };

  return (
    <div className="form-section">
      <h2>Use a Function</h2>
      <div className="form-group">
        <label>Select Function</label>
        <select value={selectedFuncName} onChange={e => setSelectedFuncName(e.target.value)}>
          <option value="">-- Select a function --</option>
          {functions.map((func) => (
            <option key={func.name} value={func.name}>{func.name}</option>
          ))}
        </select>
      </div>

      {currentFunction && (
        <>
          <div className="function-reference">
            <strong>Formula:</strong> <code>{currentFunction.expression}</code>
          </div>
          {currentFunction.notes && (
            <div className="function-notes">
              <p>{currentFunction.notes}</p>
            </div>
          )}

          <div className="variable-inputs">
            <h4>Enter Variable Values:</h4>
            {currentFunction.variables.split(',').map((v) => {
              const varName = v.trim();
              if (varName.startsWith('resultOf')) return null; 
              return (
                <div className="form-group" key={varName}>
                  <label>{varName}</label>
                  <input
                    type="number"
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                  />
                </div>
              );
            })}
          </div>

          <div className="form-actions">
            {/* "Calculate Now" button was removed for live calculations */}
            <button className="add-to-chain-btn" onClick={handleAddClick}>Add to Chain</button>
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