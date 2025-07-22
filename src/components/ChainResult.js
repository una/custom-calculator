import React from 'react';
import { Card, Heading, Flex, Box, Text } from '@radix-ui/themes';

function ChainResult({ results }) {
  if (results.length === 0) {
    return null;
  }

  const finalResult = results[results.length - 1]?.result;

  return (
    <Box mt="4">
      <Card>
        <Heading as="h3" size="3" mb="2">Calculation Steps</Heading>
        <Flex direction="column" gap="1">
          {results.map((item, index) => (
            <Flex key={index} justify="between">
              <Text weight="bold">{item.name}:</Text>
              <Text color="gray">{item.result}</Text>
            </Flex>
          ))}
        </Flex>
        <Box mt="3" p="2" style={{ background: 'var(--green-a2)', borderRadius: 'var(--radius-2)'}}>
          <Flex justify="between">
            <Text weight="bold">Final Result:</Text>
            <Text weight="bold">{finalResult}</Text>
          </Flex>
        </Box>
      </Card>
    </Box>
  );
}

export default ChainResult;
