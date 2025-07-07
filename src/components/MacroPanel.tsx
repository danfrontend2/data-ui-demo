import React from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface MacroPanelProps {
  isOpen: boolean;
  onClose: () => void;
  macroData?: {
    prompt: string;
    steps: any[];
  };
}

const MacroPanel: React.FC<MacroPanelProps> = ({ isOpen, onClose, macroData }) => {
  if (!isOpen || !macroData) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '300px',
        backgroundColor: 'background.paper',
        boxShadow: -3,
        zIndex: 1200,
        overflow: 'auto',
        transition: 'transform 0.3s ease-in-out',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Macro Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Prompt:</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{macroData.prompt}</Typography>
        
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Steps:</Typography>
        <Box sx={{ pl: 2 }}>
          {macroData.steps.map((step, index) => (
            <Typography key={index} variant="body2" sx={{ mb: 1 }}>
              {index + 1}. {step.type}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default MacroPanel; 