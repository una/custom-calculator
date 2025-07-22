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
      if (func.type === 'nested' && func.nestedFunction && functionMap[func.nestedFunction]) {
        // The function with 'nestedFunction' property is the parent.
        // The function referred to by 'nestedFunction' is the child.
        const parent = functionMap[func.name];
        const child = functionMap[func.nestedFunction];
        
        // Avoid circular dependencies
        let current = parent;
        let isCircular = false;
        while (current) {
          if (current.name === child.name) {
            isCircular = true;
            break;
          }
          const nextParentFunc = functions.find(f => f.nestedFunction === current.name);
          current = nextParentFunc ? functionMap[nextParentFunc.name] : null;
        }

        if (!isCircular) {
          parent.children.push(child);
          childFunctionNames.add(child.name);
        }
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
  }, [selectedFunction, functions]);

  const handleCalculate = () => {
    onCalculate(selectedFunction, variableValues);
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
            <Button variant="outline" onClick={() => onEdit(selectedFunction)}>Edit</Button>
            <Button color="red" variant="soft" onClick={() => {
              onDelete(selectedFunction.name);
              setSelectedFunction(null);
            }}>Delete</Button>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

export default UseFunctionForm;
