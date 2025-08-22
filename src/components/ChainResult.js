import React from 'react';
import { Card, Heading, Flex, Box, Text } from '@radix-ui/themes';

function ChainResult({ results, showSteps }) {
  console.log('ChainResult results:', results);
  if (results.length === 0) {
    return null;
  }

  const finalResult = results[results.length - 1];
  const steps = results.slice(0, -1);

  return (
    <Box mt="4">
      <Card>
        <Box p="2" style={{ background: 'var(--green-a3)', borderRadius: 'var(--radius-2)'}}>
          <Flex justify="between">
            <Text weight="bold" size="5">Result:</Text>
            <Text weight="bold" size="5">{finalResult.result}{finalResult.unit ? ` ${finalResult.unit}` : ''}</Text>
          </Flex>
        </Box>
        {showSteps && (
          <>
            <Heading as="h3" size="3" mt="2" mb="2">Calculation Steps</Heading>
            <Flex direction="column" gap="1" mb="2">
              {steps.map((item, index) => (
                <Flex key={index} justify="between">
                  <Text size="3">{item.name}:</Text>
                  <Text size="3" color="gray">{item.result}{item.unit ? ` ${item.unit}` : ''}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}
      </Card>
    </Box>
  );
}

export default ChainResult;
