import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, TextField, Text } from '@radix-ui/themes';

function FunctionSettingsDialog({ open, onOpenChange, onSave, func }) {
  const [decimalPlaces, setDecimalPlaces] = useState(4);
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (func) {
      setDecimalPlaces(func.settings?.decimalPlaces ?? 4);
      setTags(func.settings?.tags?.join(', ') || '');
    }
  }, [func]);

  const handleSave = () => {
    onSave({
      ...func,
      settings: {
        decimalPlaces: parseInt(decimalPlaces, 10),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Settings for {func?.name}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Manage settings for this function.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Decimal Places
            </Text>
            <TextField.Root
              type="number"
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(e.target.value)}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Tags (comma-separated)
            </Text>
            <TextField.Root
              placeholder="e.g., math, finance"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleSave}>Save</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default FunctionSettingsDialog;
