import React, { useState, useEffect } from 'react';
import { Button, TextField, TextArea, Box, Flex, Text, Heading } from '@radix-ui/themes';
import Select from 'react-select';
function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit, functions, onDelete }) {
  // State for the form fields
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  // State to manage the nested functions
  const [nestedFunctions, setNestedFunctions] = useState([]);

  // Effect to populate the form when editing a function
  useEffect(() => {
    if (editingFunction) {
      const { name, expression, variables, notes, nestedFunctions: nestedFuncs } = editingFunction;
      setName(name);
      setNotes(notes || '');
      setExpression(expression || '');
      setVariables(variables || '');
      setNestedFunctions(nestedFuncs || []);
    } else {
      // Clear form when not editing
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setNestedFunctions([]);
    }
  }, [editingFunction]);

  // Effect to auto-populate variables from nested functions
  useEffect(() => {
    const allVars = new Set();
    nestedFunctions.forEach(func => {
      if (func && func.variables) {
        func.variables.split(',').forEach(v => allVars.add(v.trim()));
      }
    });
    setVariables(Array.from(allVars).join(', '));
  }, [nestedFunctions]);
  
  const handleSubmit = () => {
    if (!name || !expression || !variables) {
      setError('Function Name, Expression, and Variables are required.');
      return;
    }

    let funcData = { 
      name, 
      notes, 
      expression, 
      variables,
      nestedFunctions
    };
    
    setError('');
    onSaveOrUpdate(funcData, !!editingFunction);

    // Clear form if we are not editing
    if (!editingFunction) {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setNestedFunctions([]);
    }
  };

  // Filter out chained functions from the dropdown to prevent nesting chains
  const availableFunctions = functions.filter(f => f.type !== 'chain');

  return (
    <Box>
      <Flex direction="column" gap="3">
        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Function Name*
          </Text>
          <TextField.Root
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!!editingFunction}
          />
          {editingFunction && <Text as="div" size="1" mt="1">The function name cannot be changed.</Text>}
        </label>

        <Box p="3" style={{ background: 'var(--gray-a2)', borderRadius: 'var(--radius-3)' }}>
          <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Nest Functions (optional)
          </Text>
          </label>
          <Select
            isMulti
            options={availableFunctions.map(f => ({ value: f.name, label: `${f.name} (${f.variables})`, variables: f.variables }))}
            onChange={(selectedOptions) => setNestedFunctions(selectedOptions || [])}
            value={nestedFunctions}
          />
          {nestedFunctions.length > 0 && <Text as="p" size="2" mt="2">Use <strong>{`{functionName}`}</strong> in your expression to access the result of a nested function. For example, to use the result of "{nestedFunctions[0].value}", you would use <strong>{`{${nestedFunctions[0].value}}`}</strong>.</Text>}
        </Box>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Expression*
          </Text>
          <TextArea type="text" value={expression} onChange={(e) => setExpression(e.target.value)} rows={2}/>
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Variables (comma-separated)*
          </Text>
          <TextField.Root type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Note (Optional)
          </Text>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
      </Flex>
      
      {error && <Text color="red" size="2" mt="2">{error}</Text>}
      
      <Flex gap="3" mt="4">
        <Button onClick={handleSubmit}>{editingFunction ? 'Update Function' : 'Save Function'}</Button>
        {editingFunction && <Button variant="soft" onClick={onCancelEdit}>Cancel</Button>}
        {editingFunction && <Button color="red" variant="soft" onClick={() => onDelete(name)}>Delete</Button>}
      </Flex>
    </Box>
  );
}

export default CreateFunctionForm;
