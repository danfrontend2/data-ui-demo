import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface MacroMessageProps {
  message: string | null;
  onClose: () => void;
}

const MacroMessage: React.FC<MacroMessageProps> = ({ message, onClose }) => {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={null}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity="info" 
        variant="filled"
        sx={{ 
          width: '100%',
          '& .MuiAlert-message': {
            fontSize: '1.5rem',
            fontWeight: 500
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default MacroMessage; 