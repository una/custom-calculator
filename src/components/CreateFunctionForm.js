import React, { useState, useEffect } from 'react';

function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit }) {
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [notes, setNotes] = useState(''); // New state for notes
  const [error, setError] = useState('');

  // Effect to populate form when editing
  useEffect(() => {
    if (editingFunction) {
      setName(editingFunction.name);
      setExpression(editingFunction.expression);
      setVariables(editingFunction.variables);
      setNotes(editingFunction.notes || ''); // Populate notes, or empty string if none exist
    } else {
      // Clear form when not editing
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
    }
  }, [editingFunction]);

  const handleSubmit = () => {
    if (!name || !expression || !variables) {
      setError('Name, Expression, and Variables are required.');
      return;
    }
    // ... (validation logic remains the same)
    setError('');

    // Include notes in the data object
    onSaveOrUpdate({ name, expression, variables, notes }, !!editingFunction);

    if (!editingFunction) {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
    }
  };

  return (
    <div className="form-section">
      <h2>{editingFunction ? 'Edit Function' : 'Create New Function'}</h2>
      {/* ... (Name, Expression, Variables form groups remain the same) ... */}
       <div className="form-group">
        <label>Function Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!!editingFunction}
        />
      </div>
      <div className="form-group">
        <label>Expression</label>
        <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Variables (comma-separated)</label>
        <input type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
      </div>
      
      {/* --- NEW: Notes Textarea --- */}
      <div className="form-group">
        <label>Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="3"
          placeholder="e.g., Calculates the area of any circle given its radius."
        ></textarea>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button onClick={handleSubmit}>
          {editingFunction ? 'Update Function' : 'Save Function'}
        </button>
        {editingFunction && (
          <button className="cancel-btn" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateFunctionForm;