import React, { useState } from 'react';
import { Button, TextField, Box, Flex, Text, Heading } from '@radix-ui/themes';

function Settings({ token, user, setUser }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Settings updated successfully!');
        setUser(data.user);
      } else {
        setMessage(data.message || 'An error occurred during update.');
      }
    } catch (error) {
      setMessage('An error occurred during update.');
      console.error('Settings update error:', error);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="4" mb="4">User Settings</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Username
            </Text>
            <TextField.Root
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Email
            </Text>
            <TextField.Root
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              New Password
            </Text>
            <TextField.Root
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </label>
          <Button type="submit">Update Settings</Button>
        </Flex>
      </form>
      {message && <Text color={message.includes('successfully') ? 'green' : 'red'} size="2" mt="2">{message}</Text>}
    </Box>
  );
}

export default Settings;
