import React, { useState } from 'react';
import { Button, TextField, Box, Flex, Text, Heading } from '@radix-ui/themes';
function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Signup successful! You can now log in.');
      } else {
        setMessage(data.message || 'An error occurred during signup.');
      }
    } catch (error) {
      setMessage('An error occurred during signup.');
      console.error('Signup error:', error);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="4" mb="4">Signup</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Email
            </Text>
            <TextField.Root
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Password
            </Text>
            <TextField.Root
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <Button type="submit">Signup</Button>
        </Flex>
      </form>
      {message && <Text color={message.includes('successful') ? 'green' : 'red'} size="2" mt="2">{message}</Text>}
    </Box>
  );
}

export default Signup;
