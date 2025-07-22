import React, { useState, useEffect } from 'react';

function UseFunctionForm({ functions, onCalculate, onEdit, onDelete }) {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [variableValues, setVariableValues] = useState({});

  useEffect(() => {
    if (selectedFunction) {
      const initialValues = {};
      const allVars = new Set();

      // Add variables from the main function
      if (selectedFunction.variables) {
        selectedFunction.variables.split(',').forEach(v => allVars.add(v.trim()));
      }

      // If it's a nested function, add variables from the nested function
      if (selectedFunction.type === 'nested' && selectedFunction.nestedFunction) {
        const nestedFunc = functions.find(f => f.name === selectedFunction.nestedFunction);
        if (nestedFunc && nestedFunc.variables) {
          nestedFunc.variables.split(',').forEach(v => allVars.add(v.trim()));
        }
      }
      
      allVars.forEach(v => {
        initialValues[v] = '';
      });

      setVariableValues(initialValues);
    } else {
      setVariableValues({});
    }
  }, [selectedFunction, functions]);

  const handleCalculate = () => {
    onCalculate(selectedFunction, variableValues);
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
    onCalculate(null, null); // Clear previous results
  };

  const renderVariableInputs = () => {
    const varsToRender = Object.keys(variableValues);
    
    // Don't render the 'nestedResult' as an input field
    const filteredVars = varsToRender.filter(v => v !== 'nestedResult');

    return filteredVars.map(v => (
      <div className="form-group" key={v}>
        <label>{v}</label>
        <input
          type="number"
          value={variableValues[v] || ''}
          onChange={e => setVariableValues({ ...variableValues, [v]: parseFloat(e.target.value) || 0 })}
        />
      </div>
    ));
  };

  return (
    <div className="form-section">
      <h2>Use a Function</h2>
      
      {!selectedFunction ? (
        <div className="function-list">
          {functions.length > 0 ? (
            functions.map(f => (
              <button key={f.name} className="function-list-item" onClick={() => handleSelectFunction(f)}>
                {f.name}
                {f.type === 'nested' && <span className="chain-indicator">(Nested)</span>}
              </button>
            ))
          ) : (
            <p className="no-functions-message">No functions created yet. Go to the "Create" tab to add one.</p>
          )}
        </div>
      ) : (
        <div className="function-details">
          <div className="selected-function-display">
            <div className="function-list-item selected">
              {selectedFunction.name}
              {selectedFunction.type === 'nested' && <span className="chain-indicator">(Nested)</span>}
            </div>
            <button className="change-btn" onClick={() => setSelectedFunction(null)}>Change</button>
          </div>

          {selectedFunction.notes && (
            <div className="function-notes">
              <p>{selectedFunction.notes}</p>
            </div>
          )}

          <div className="variable-inputs">
            {renderVariableInputs()}
          </div>
          
          <div className="form-actions">
            <button onClick={handleCalculate}>Calculate</button>
            <button className="edit-btn" onClick={() => onEdit(selectedFunction)}>Edit</button>
            <button className="remove-btn" onClick={() => {
              onDelete(selectedFunction.name);
              setSelectedFunction(null);
            }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UseFunctionForm;
