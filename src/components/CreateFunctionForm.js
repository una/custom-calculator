import React, { useState, useEffect } from 'react';

function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit, functions }) {
  // State for the form fields
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  // State to manage the creation type and the nested function
  const [functionType, setFunctionType] = useState('single');
  const [nestedFunction, setNestedFunction] = useState('');

  // Effect to populate the form when editing a function
  useEffect(() => {
    if (editingFunction) {
      const { name, expression, variables, notes, type, nestedFunction: nestedFunc } = editingFunction;
      setName(name);
      setNotes(notes || '');
      setFunctionType(type || 'single');
      setExpression(expression || '');
      setVariables(variables || '');
      setNestedFunction(nestedFunc || '');
    } else {
      // Clear form when not editing
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setFunctionType('single');
      setNestedFunction('');
    }
  }, [editingFunction]);
  
  const handleSubmit = () => {
    if (!name || !expression || !variables) {
      setError('Function Name, Expression, and Variables are required.');
      return;
    }

    let funcData = { 
      name, 
      notes, 
      type: functionType, 
      expression, 
      variables 
    };

    if (functionType === 'nested') {
      if (!nestedFunction) {
        setError('You must select a function to nest.');
        return;
      }
      funcData.nestedFunction = nestedFunction;
    }
    
    setError('');
    onSaveOrUpdate(funcData, !!editingFunction);

    // Clear form if we are not editing
    if (!editingFunction) {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setFunctionType('single');
      setNestedFunction('');
    }
  };

  // Filter out chained functions from the dropdown to prevent nesting chains
  const availableFunctions = functions.filter(f => f.type !== 'chain');

  return (
    <div className="form-section">
      <h2>{editingFunction ? 'Edit Function' : 'Create New Function'}</h2>
      
      {/* Function Name and Notes are common to both types */}
      <div className="form-group">
        <label>Function Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} readOnly={!!editingFunction} />
        {editingFunction && <small>The function name cannot be changed.</small>}
      </div>
      <div className="form-group">
        <label>Notes (Optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3"></textarea>
      </div>

      {/* --- Type Selector --- */}
      {!editingFunction && (
        <div className="form-group">
          <label>Function Type</label>
          <div className="radio-group">
            <label><input type="radio" value="single" checked={functionType === 'single'} onChange={() => setFunctionType('single')} /> Single Function</label>
            <label><input type="radio" value="nested" checked={functionType === 'nested'} onChange={() => setFunctionType('nested')} /> Nested Function</label>
          </div>
        </div>
      )}

      {/* --- UI for NESTED functions --- */}
      {functionType === 'nested' && (
        <div className="form-section-inset">
          <h4>Nest a Function</h4>
          <div className="form-group">
            <label>Select a function to nest:</label>
            <select 
              onChange={(e) => setNestedFunction(e.target.value)} 
              value={nestedFunction}
            >
              <option value="">-- Select a function --</option>
              {availableFunctions.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          {nestedFunction && <p className="helper-text">Use <strong>nestedResult</strong> in your expression to access the result of '{nestedFunction}'.</p>}
        </div>
      )}

      {/* --- Common form fields for Expression and Variables --- */}
      <div className="form-group">
        <label>Expression</label>
        <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Variables (comma-separated)</label>
        <input type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
      </div>
      
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button onClick={handleSubmit}>{editingFunction ? 'Update Function' : 'Save Function'}</button>
        {editingFunction && <button className="cancel-btn" onClick={onCancelEdit}>Cancel Edit</button>}
      </div>
    </div>
  );
}

export default CreateFunctionForm;
