import React, { useState, useEffect } from 'react';
import { Button, TextField, TextArea, Select, RadioGroup, Box, Flex, Text, Heading } from '@radix-ui/themes';
function CreateFunctionForm({ onSaveOrUpdate, editingFunction, onCancelEdit, functions, onDelete }) {
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
    <Box>
      <Flex direction="column" gap="3">
        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Function Name
          </Text>
          <TextField.Root
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!!editingFunction}
          />
          {editingFunction && <Text as="div" size="1" mt="1">The function name cannot be changed.</Text>}
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Notes (Optional)
          </Text>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        {!editingFunction && (
          <RadioGroup.Root value={functionType} onValueChange={setFunctionType}>
            <Flex gap="2" align="center">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="single" /> Single Function
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="nested" /> Nested Function
                </Flex>
              </Text>
            </Flex>
          </RadioGroup.Root>
        )}

        {functionType === 'nested' && (
          <Box p="3" style={{ background: 'var(--gray-a2)', borderRadius: 'var(--radius-3)' }}>
            <Heading as="h3" size="3" mb="2">Nest a Function</Heading>
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Select a function to nest:
              </Text>
              <Select.Root onValueChange={setNestedFunction} value={nestedFunction}>
                <Select.Trigger placeholder="-- Select a function --" />
                <Select.Content>
                  {availableFunctions.map(f => <Select.Item key={f.name} value={f.name}>{f.name}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </label>
            {nestedFunction && <Text as="p" size="2" mt="2">Use <strong>nestedResult</strong> in your expression to access the result of '{nestedFunction}'.</Text>}
          </Box>
        )}

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Expression
          </Text>
          <TextField.Root type="text" value={expression} onChange={(e) => setExpression(e.target.value)} />
        </label>

        <label>
          <Text as="div" size="2" mb="1" weight="bold">
            Variables (comma-separated)
          </Text>
          <TextField.Root type="text" value={variables} onChange={(e) => setVariables(e.target.value)} />
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
