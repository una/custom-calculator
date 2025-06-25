import React, { useState, useEffect } from 'react';

function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit }) {
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [error, setError] = useState('');

  // This effect fills the form when an editingFunction is passed in
  useEffect(() => {
    if (editingFunction) {
      setName(editingFunction.name);
      setExpression(editingFunction.expression);
      setVariables(editingFunction.variables);
    } else {
      // Clear form when not in edit mode
      setName('');
      setExpression('');
      setVariables('');
    }
  }, [editingFunction]);

  const handleSubmit = () => {
    if (!name || !expression || !variables) {
      setError('All fields are required.');
      return;
    }
    if (!/^[a-zA-Z_]+(?:,\s*[a-zA-Z_]+)*$/.test(variables)) {
      setError('Variables must be a comma-separated list of letters (e.g., x, y, z).');
      return;
    }
    setError('');

    const isUpdating = !!editingFunction;
    onSaveOrUpdate({ name, expression, variables }, isUpdating);

    // Clear form fields only if we are creating a new entry
    if (!isUpdating) {
      setName('');
      setExpression('');
      setVariables('');
    }
  };

  return (
    <div className="form-section">
      <h2>{editingFunction ? 'Edit Function' : 'Create New Function'}</h2>
      <div className="form-group">
        <label>Function Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Area of Circle"
          readOnly={!!editingFunction} // Make name read-only during edit
        />
        {editingFunction && <small>The function name cannot be changed.</small>}
      </div>
      <div className="form-group">
        <label>Expression</label>
        <input type="text" value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="e.g., pi * r^2" />
      </div>
      <div className="form-group">
        <label>Variables (comma-separated)</label>
        <input type="text" value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="e.g., r" />
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