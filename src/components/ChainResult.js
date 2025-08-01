import React from 'react';
import { motion } from 'framer-motion';
import { Card, Heading, Flex, Box, Text } from '@radix-ui/themes';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

function ChainResult({ results }) {
  if (results.length === 0) {
    return null;
  }

  const finalResult = results[results.length - 1]?.result;

  return (
    <Box mt="4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <Heading as="h3" size="3" mb="2">Calculation Steps</Heading>
          <Flex direction="column" gap="1">
            {results.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Flex justify="between">
                  <Text weight="bold">{item.name}:</Text>
                  <Text color="gray">{item.result}</Text>
                </Flex>
              </motion.div>
            ))}
          </Flex>
          <motion.div variants={itemVariants}>
            <Box mt="3" p="2" style={{ background: 'var(--green-a2)', borderRadius: 'var(--radius-2)'}}>
              <Flex justify="between">
                <Text weight="bold">Final Result:</Text>
                <Text weight="bold">{finalResult}</Text>
              </Flex>
            </Box>
          </motion.div>
        </Card>
      </motion.div>
    </Box>
  );
}

export default ChainResult;
