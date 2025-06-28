import React, { useState, useEffect } from 'react';

function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit, functions }) {
  // State for the form fields
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  // State to manage the creation type and the chain being built
  const [functionType, setFunctionType] = useState('single');
  const [chain, setChain] = useState([]);

  // Effect to populate the form when editing a function
  useEffect(() => {
    if (editingFunction) {
      const { name, expression, variables, notes, type, chain } = editingFunction;
      setName(name);
      setNotes(notes || '');
      setFunctionType(type || 'single');

      if (type === 'chain') {
        setExpression('');
        setVariables('');
        setChain(chain || []);
      } else {
        setExpression(expression || '');
        setVariables(variables || '');
        setChain([]);
      }
    } else {
      // Clear form when not editing
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setFunctionType('single');
      setChain([]);
    }
  }, [editingFunction]);

  const handleAddToChain = (funcName) => {
    if (funcName && !chain.includes(funcName)) {
      setChain([...chain, funcName]);
    }
  };

  const handleRemoveFromChain = (indexToRemove) => {
    setChain(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleSubmit = () => {
    if (!name) {
      setError('Function Name is required.');
      return;
    }

    let funcData = { name, notes };

    if (functionType === 'single') {
      if (!expression || !variables) {
        setError('Expression and Variables are required for a single function.');
        return;
      }
      funcData = { ...funcData, type: 'single', expression, variables };
    } else { // Chained function
      if (chain.length < 2) {
        setError('A chained function must contain at least two steps.');
        return;
      }
      funcData = { ...funcData, type: 'chain', chain };
    }
    
    setError('');
    onSaveOrUpdate(funcData, !!editingFunction);

    if (!editingFunction) {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setChain([]);
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
            <label><input type="radio" value="chain" checked={functionType === 'chain'} onChange={() => setFunctionType('chain')} /> Chained Function</label>
          </div>
        </div>
      )}

      {/* --- UI for SINGLE functions --- */}
      {functionType === 'single' && (
        <>
          <div className="form-group">
            <label>Expression</label>
            <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Variables (comma-separated)</label>
            <input type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
          </div>
        </>
      )}

      {/* --- UI for CHAINED functions --- */}
      {functionType === 'chain' && (
        <div className="form-section-inset">
          <h4>Build Your Chain</h4>
          <div className="form-group">
            <label>Add a function to the chain:</label>
            <select onChange={(e) => handleAddToChain(e.target.value)} value="">
              <option value="">-- Select a function to add --</option>
              {availableFunctions.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
          </div>
          {chain.length > 0 && (
            <ol className="calculation-chain-list">
              {chain.map((funcName, index) => (
                <li key={`${funcName}-${index}`}>
                  <span>{funcName}</span>
                  <button className="remove-btn" onClick={() => handleRemoveFromChain(index)}>Remove</button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button onClick={handleSubmit}>{editingFunction ? 'Update Function' : 'Save Function'}</button>
        {editingFunction && <button className="cancel-btn" onClick={onCancelEdit}>Cancel Edit</button>}
      </div>
    </div>
  );
}

export default CreateFunctionForm;