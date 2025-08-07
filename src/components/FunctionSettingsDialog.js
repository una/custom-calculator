import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, TextField, Text, Badge, Box, AlertDialog } from '@radix-ui/themes';

function FunctionSettingsDialog({ open, onOpenChange, onSave, onDelete, functionData, allTags = [] }) {
  const [decimalPlaces, setDecimalPlaces] = useState(4);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (functionData) {
      setDecimalPlaces(functionData.settings?.decimalPlaces ?? 4);
      setTags(functionData.settings?.tags || []);
    }
  }, [functionData]);

  const handleSave = () => {
    const parsedDecimalPlaces = parseInt(decimalPlaces, 10);
    onSave({
      ...functionData.settings,
      decimalPlaces: isNaN(parsedDecimalPlaces) ? 4 : parsedDecimalPlaces,
      tags,
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
        <Dialog.Title>Settings for {functionData?.name}</Dialog.Title>
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

        <Flex gap="3" mt="4" justify="between">
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button color="red"><span className="material-symbols-outlined">delete</span> Delete</Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content style={{ maxWidth: 450 }}>
              <AlertDialog.Title>Delete Function</AlertDialog.Title>
              <AlertDialog.Description size="2">
                Are you sure you want to delete the function "{functionData?.name}"? This action cannot be undone.
              </AlertDialog.Description>

              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button variant="solid" color="red" onClick={() => onDelete(functionData.id)}>
                    Delete
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                <span className="material-symbols-outlined">cancel</span> Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave}><span className="material-symbols-outlined">save</span> Save</Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default FunctionSettingsDialog;
