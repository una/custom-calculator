import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Flex, Text, Heading, Card } from '@radix-ui/themes';
import * as math from 'mathjs';
import FunctionSettingsDialog from './FunctionSettingsDialog';

function UseFunctionForm({ functions, onCalculate, onEdit, onDelete, setExecutionResults, onUpdateFunction }) {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [variableValues, setVariableValues] = useState({});

  const renderFunctionList = () => {
    if (functions.length === 0) {
      return <Text>No functions created yet. Go to the "Create" tab to add one.</Text>;
    }

    return functions.map(func => (
      <Box key={func.name} style={{ marginTop: '4px' }}>
        <Button onClick={() => handleSelectFunction(func)} variant="soft" style={{ width: '100%', justifyContent: 'flex-start' }}>
          {func.name}
        </Button>
      </Box>
    ));
  };

  useEffect(() => {
    if (selectedFunction) {
      const newVariableValues = {};
      const allVars = new Set();
      const mathjsKeywords = new Set(Object.keys(math));
  
      // Collect explicitly defined variables
      if (selectedFunction.variables) {
        selectedFunction.variables.split(',').forEach(v => v && allVars.add(v.trim()));
      }
      selectedFunction.subFunctions?.forEach(sf => {
        if (sf.variables) {
          sf.variables.split(',').forEach(v => v && allVars.add(v.trim()));
        }
      });

      // Collect variables from expressions
      const allExpressions = [selectedFunction.expression];
      selectedFunction.subFunctions?.forEach(sf => allExpressions.push(sf.expression));

      allExpressions.forEach(expr => {
          if (!expr) return;
          try {
              let sanitizedExpr = expr.replace(/\{([\w\s]+?)\}/g, '1');
              const node = math.parse(sanitizedExpr);
              node.traverse(function (n) {
                  if (n.isSymbolNode && !mathjsKeywords.has(n.name)) {
                      allVars.add(n.name);
                  }
              });
          } catch (e) {
              console.warn(`Expression parsing error in UseFunctionForm: ${e.message}`);
          }
      });
      
      allVars.forEach(v => {
        if (v) {
          newVariableValues[v] = '';
        }
      });
  
      setVariableValues(newVariableValues);
    } else {
      setVariableValues({});
    }
  }, [selectedFunction]);

  const handleCalculate = () => {
    onCalculate(selectedFunction, variableValues);
  };

  const handleSaveSettings = (updatedFunction) => {
    onUpdateFunction(updatedFunction);
    setSelectedFunction(updatedFunction);
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
    setExecutionResults([]);
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
            <Button variant="soft" onClick={() => {
              setSelectedFunction(null);
              setExecutionResults([]);
            }}>Cancel</Button>
            <Button variant="outline" onClick={() => onEdit(selectedFunction)}>Edit</Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>Settings</Button>
          </Flex>
        </Flex>
      )}
      {selectedFunction && (
        <FunctionSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setSettingsOpen}
          onSave={handleSaveSettings}
          func={selectedFunction}
        />
      )}
    </Box>
  );
}

export default UseFunctionForm;
