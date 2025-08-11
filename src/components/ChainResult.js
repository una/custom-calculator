import React from 'react';
import { Card, Heading, Flex, Box, Text } from '@radix-ui/themes';

function ChainResult({ results, showSteps }) {
  if (results.length === 0) {
    return null;
  }

  const finalResult = results[results.length - 1];
  const steps = results.slice(0, -1);

  return (
    <Box mt="4">
      <Card>
        {showSteps && (
          <>
            <Heading as="h3" size="3" mb="2">Calculation Steps</Heading>
            <Flex direction="column" gap="1" mb="2">
              {steps.map((item, index) => (
                <Flex key={index} justify="between">
                  <Text size="3">{item.name}:</Text>
                  <Text size="3" color="gray">{item.result}</Text>
                </Flex>
              ))}
            </Flex>
          </>
        )}
        <Box p="2" style={{ background: 'var(--green-a3)', borderRadius: 'var(--radius-2)'}}>
          <Flex justify="between">
            <Text weight="bold" size="5">{finalResult.name}:</Text>
            <Text weight="bold" size="5">{finalResult.result}</Text>
          </Flex>
        </Box>
      </Card>
    </Box>
  );
}

export default ChainResult;
