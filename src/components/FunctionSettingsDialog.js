import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, TextField, Text, Badge, Box } from '@radix-ui/themes';

function FunctionSettingsDialog({ open, onOpenChange, onSave, func, allTags = [] }) {
  const [decimalPlaces, setDecimalPlaces] = useState(4);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (func) {
      setDecimalPlaces(func.settings?.decimalPlaces ?? 4);
      setTags(func.settings?.tags || []);
    }
  }, [func]);

  const handleSave = () => {
    onSave({
      ...func,
      settings: {
        ...func.settings,
        decimalPlaces: parseInt(decimalPlaces, 10),
        tags,
      }
    });
    onOpenChange(false);
  };

  const handleAddTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
          <Box>
            <Text as="div" size="2" mb="1" weight="bold">Tags</Text>
            <Flex gap="2" align="center">
              <TextField.Root
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag"
              />
              <Button onClick={() => handleAddTag(tagInput)}>Add</Button>
            </Flex>
            <Flex gap="2" mt="2" wrap="wrap">
              {tags.map(tag => (
                <Badge key={tag} variant="soft" color="gray" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag)}>
                  {tag} &times;
                </Badge>
              ))}
            </Flex>
            <Flex gap="2" mt="2" wrap="wrap">
            {allTags.filter(t => !tags.includes(t)).map(tag => (
              <Button key={tag} variant="soft" size="1" onClick={() => handleAddTag(tag)}>
                + {tag}
              </Button>
            ))}
          </Flex>
          </Box>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              <span className="material-symbols-outlined">cancel</span> Cancel
            </Button>
          </Dialog.Close>
          <Button onClick={handleSave}><span className="material-symbols-outlined">save</span> Save</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default FunctionSettingsDialog;
