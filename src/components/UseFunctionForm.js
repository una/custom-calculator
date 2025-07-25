import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Flex, Text, Heading, Card } from '@radix-ui/themes';
function UseFunctionForm({ functions, onCalculate, onEdit, onDelete }) {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [variableValues, setVariableValues] = useState({});

  const renderFunctionList = () => {
    const functionMap = {};
    const childFunctionNames = new Set();

    functions.forEach(func => {
      functionMap[func.name] = { ...func, children: [] };
    });

    functions.forEach(func => {
      if (func.nestedFunctions && func.nestedFunctions.length > 0) {
        func.nestedFunctions.forEach(nestedFuncName => {
          if (functionMap[nestedFuncName]) {
            const parent = functionMap[func.name];
            const child = functionMap[nestedFuncName];
            parent.children.push(child);
            childFunctionNames.add(child.name);
          }
        });
      }
    });

    const topLevelFunctions = functions.filter(func => !childFunctionNames.has(func.name));

    const renderFunction = (func, level = 0) => (
      <Box key={func.name} style={{ marginLeft: level > 0 ? '20px' : '0px', marginTop: '4px' }}>
        <Button onClick={() => handleSelectFunction(functions.find(f => f.name === func.name))} variant="soft" style={{ width: '100%', justifyContent: 'flex-start' }}>
          {func.name}
        </Button>
        {func.children.length > 0 && (
          <Box>
            {func.children.map(child => renderFunction(child, level + 1))}
          </Box>
        )}
      </Box>
    );

    if (functions.length === 0) {
      return <Text>No functions created yet. Go to the "Create" tab to add one.</Text>;
    }

    return topLevelFunctions.map(f => renderFunction(functionMap[f.name]));
  };

  useEffect(() => {
    if (selectedFunction) {
      const newVariableValues = { ...variableValues };
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
        if (!newVariableValues.hasOwnProperty(v)) {
          newVariableValues[v] = '';
        }
      });

      setVariableValues(newVariableValues);
    } else {
      setVariableValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFunction, functions]);

  const handleCalculate = () => {
    onCalculate(selectedFunction, variableValues);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedFunction.name}?`)) {
      onDelete(selectedFunction.id);
      setSelectedFunction(null);
    }
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
  };

  const renderVariableInputs = () => {
    const varsToRender = Object.keys(variableValues);
    const filteredVars = varsToRender.filter(v => v !== 'nestedResult');

    return filteredVars.map(v => (
      <label key={v}>
        <Text as="div" size="2" mb="1" weight="bold">
          {v}
        </Text>
        <TextField.Root
          type="number"
          value={variableValues[v] || ''}
          onChange={e => setVariableValues({ ...variableValues, [v]: parseFloat(e.target.value) || 0 })}
        />
      </label>
    ));
  };

  return (
    <Box>
      <Heading as="h2" size="4" mb="4">Use a Function</Heading>
      
      {!selectedFunction ? (
        <Flex direction="column" gap="2">
          {renderFunctionList()}
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          <Card>
            <Flex justify="between" align="center">
              <Box>
                <Text weight="bold">{selectedFunction.name}</Text>
              </Box>
              <Button variant="soft" onClick={() => setSelectedFunction(null)}>Change</Button>
            </Flex>
            {selectedFunction.notes && (
              <Box mt="2" p="2" style={{ background: 'var(--yellow-a2)', borderRadius: 'var(--radius-2)'}}>
                <Text size="2" italic>{selectedFunction.notes}</Text>
              </Box>
            )}
          </Card>

          <Flex direction="column" gap="2">
            {renderVariableInputs()}
          </Flex>
          
          <Flex gap="3" mt="2">
            <Button onClick={handleCalculate}>Calculate</Button>
            <Button variant="soft" onClick={() => setSelectedFunction(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => onEdit(selectedFunction)}>Edit</Button>
            <Button variant="outline" color="red" onClick={handleDelete}>Delete</Button>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

export default UseFunctionForm;
