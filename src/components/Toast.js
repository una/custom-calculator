import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import './Toast.css';

const ToastDemo = ({ open, setOpen, title, message }) => {
  return (
    <Toast.Provider swipeDirection="right">
			<Toast.Root className="ToastRoot" open={open} onOpenChange={setOpen} duration={3000}>
				<Toast.Title className="ToastTitle">{title}</Toast.Title>
				<Toast.Description className="ToastDescription">
					{message}
				</Toast.Description>
			</Toast.Root>
			<Toast.Viewport className="ToastViewport" />
		</Toast.Provider>
	);
};

export default ToastDemo;
