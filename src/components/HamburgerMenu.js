import React from 'react';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';

function HamburgerMenu({ onSettingsClick, onLogoutClick }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton variant="ghost">
          <HamburgerMenuIcon />
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
