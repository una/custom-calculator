import React, { useState, useEffect } from 'react';
import { Button, TextField, TextArea, Box, Flex, Text, Heading, Card, Badge } from '@radix-ui/themes';

function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit, functions, onDelete, allTags = [], onOpenSettings }) {
  const [name, setName] = useState('');
  const [expression, setExpression] = useState('');
  const [variables, setVariables] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  const [subFunctions, setSubFunctions] = useState([]);

  useEffect(() => {
    if (editingFunction) {
      const { name, expression, variables, notes, subFunctions: subFuncs, settings } = editingFunction;
      setName(name);
      setNotes(notes || '');
      setExpression(expression || '');
      setVariables(variables || '');
      setSubFunctions((subFuncs || []).map(sf => ({ ...sf, id: Date.now() + Math.random() })));
    } else {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setSubFunctions([]);
    }
  }, [editingFunction]);

  const handleAddSubFunction = () => {
    setSubFunctions([...subFunctions, { id: Date.now(), name: '', expression: '', variables: '' }]);
  };

  const handleRemoveSubFunction = (id) => {
    setSubFunctions(subFunctions.filter(sf => sf.id !== id));
  };

  const handleSubFunctionChange = (id, field, value) => {
    setSubFunctions(subFunctions.map(sf => sf.id === id ? { ...sf, [field]: value } : sf));
  };

  const handleSubmit = () => {
    if (!name || !expression || !variables) {
      setError('Function Name, Expression, and Variables are required.');
      return;
    }

    const funcData = { 
      name, 
      notes, 
      expression, 
      variables,
      subFunctions: subFunctions.map(({ id, ...rest }) => rest), // Remove temporary id
      id: editingFunction ? editingFunction.id : undefined,
      settings: { ...editingFunction?.settings }
    };
    
    setError('');
    onSaveOrUpdate(funcData, !!editingFunction);

    if (!editingFunction) {
      setName('');
      setExpression('');
      setVariables('');
      setNotes('');
      setSubFunctions([]);
    }
  };

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
          />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Main Variables (comma-separated)*
          </Text>
          <TextField.Root type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Main Expression*
          </Text>
          <TextField.Root type="text" value={expression} onChange={(e) => setExpression(e.target.value)} rows={2}/>
        </label>

        <Card>
          <Heading as="h3" size="3" mb="2">Sub-functions (optional)</Heading>
          <Text as="p" size="2" mb="3">Define helper functions that can be used in your main expression. Use <strong>{`{subFunctionName}`}</strong> to access their results.</Text>
          {subFunctions.map((sf, index) => (
            <Box key={sf.id} p="3" mb="3" style={{ background: 'var(--gray-a2)', borderRadius: 'var(--radius-3)' }}>
              <Flex direction="column" gap="2">
                <TextField.Root placeholder="Name" value={sf.name} onChange={e => handleSubFunctionChange(sf.id, 'name', e.target.value)} />
                <TextField.Root placeholder="Expression" value={sf.expression} onChange={e => handleSubFunctionChange(sf.id, 'expression', e.target.value)} />
                <TextField.Root placeholder="Variables (optional, comma-separated)" value={sf.variables} onChange={e => handleSubFunctionChange(sf.id, 'variables', e.target.value)} />
                <Button size="1" color="red" variant="soft" onClick={() => handleRemoveSubFunction(sf.id)} style={{ alignSelf: 'flex-end' }}>Remove</Button>
              </Flex>
            </Box>
          ))}
          <Button variant="soft" onClick={handleAddSubFunction}>+ Add Sub-function</Button>
        </Card>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Note
          </Text>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder='Optional note' />
        </label>
      </Flex>
      
      {error && <Text color="red" size="2" mt="2">{error}</Text>}
      
      <Flex gap="3" mt="4">
        <Button onClick={handleSubmit}>{editingFunction ? 'Update Function' : 'Save Function'}</Button>
        {editingFunction && <Button variant="soft" onClick={onCancelEdit}>Cancel</Button>}
        {editingFunction && <Button color="red" variant="soft" onClick={() => onDelete(editingFunction.id)}>Delete</Button>}
        {editingFunction && <Button variant="outline" onClick={onOpenSettings}>Settings</Button>}
      </Flex>
    </Box>
  );
}

export default CreateFunctionForm;
