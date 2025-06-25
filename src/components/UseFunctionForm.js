import React, { useState, useEffect } from 'react';
import * as math from 'mathjs';

function UseFunctionForm({ functions, onCalculate, onEdit, onDelete }) {
  const [selectedFunc, setSelectedFunc] = useState('');
  const [variableValues, setVariableValues] = useState({});
  const [error, setError] = useState('');

  // This effect now also clears the selection if the functions list changes (e.g., after a delete)
  useEffect(() => {
    // If the currently selected function no longer exists in the list, reset the form
    if (selectedFunc && !functions.some(f => f.name === selectedFunc)) {
      setSelectedFunc('');
    }
  }, [functions, selectedFunc]);


  useEffect(() => {
    setVariableValues({});
    setError('');
  }, [selectedFunc]);

  const handleSelectChange = (e) => {
    const funcName = e.target.value;
    setSelectedFunc(funcName);
  };

  const handleVariableChange = (varName, value) => {
    setVariableValues({ ...variableValues, [varName]: value });
  };
  
  const handleDeleteClick = (funcName) => {
    if (window.confirm(`Are you sure you want to delete the function "${funcName}"?`)) {
        onDelete(funcName);
    }
  };

  const handleCalculate = () => {
    // ... (calculation logic remains the same)
    const func = functions.find(f => f.name === selectedFunc);
    if (!func) {
      setError('Please select a function.');
      return;
    }
    const scope = {};
    const variables = func.variables.split(',').map(v => v.trim());
    for (const v of variables) {
      if (variableValues[v] === undefined || variableValues[v] === '') {
        setError(`Please enter a value for "${v}".`);
        onCalculate(null);
        return;
      }
      scope[v] = parseFloat(variableValues[v]);
      if (isNaN(scope[v])) {
        setError(`Invalid number for variable "${v}".`);
        onCalculate(null);
        return;
      }
    }
    try {
      const result = math.evaluate(func.expression, scope);
      setError('');
      onCalculate(result);
    } catch (e) {
      setError(`Error in expression: ${e.message}`);
      onCalculate(null);
    }
  };

  const currentFunction = functions.find(f => f.name === selectedFunc);

  return (
    <div className="form-section">
      <h2>Use Saved Function</h2>
      <div className="form-group">
        <label>Select Function</label>
        <select value={selectedFunc} onChange={handleSelectChange}>
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

          <div className="variable-inputs">
            <h4>Enter Variable Values:</h4>
            {currentFunction.variables.split(',').map((v) => {
              const varName = v.trim();
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
            <button onClick={handleCalculate}>Calculate</button>
            <button className="edit-btn" onClick={() => onEdit(currentFunction)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteClick(currentFunction.name)}>Delete</button>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default UseFunctionForm;