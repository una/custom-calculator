import React, { useState } from 'react';
import { Button, TextField, Box, Flex, Text, Heading } from '@radix-ui/themes';
function Login({ setToken, setUser }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setMessage(data.message || 'An error occurred during login.');
      }
    } catch (error) {
      setMessage('An error occurred during login.');
      console.error('Login error:', error);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="4" mb="4">Login</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Username or Email
            </Text>
            <TextField.Root
              type="text"
              autoComplete="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Password
            </Text>
            <TextField.Root
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <Button type="submit">Login</Button>
        </Flex>
      </form>
      {message && <Text color="red" size="2" mt="2">{message}</Text>}
    </Box>
  );
}

export default Login;
