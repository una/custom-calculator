import React from 'react';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';

function HamburgerMenu({ onSettingsClick, onLogoutClick }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          size="3"
          variant="soft"
          style={{ backgroundColor: "var(--card-background-color)" }}
          aria-label="Settings"
        >
          <HamburgerMenuIcon width="1.25rem" height="1.25rem" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={onSettingsClick}>Settings</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onClick={onLogoutClick}>
          Logout
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export default HamburgerMenu;
