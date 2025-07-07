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
  currentStepIndex?: number;
}

const MacroPanel: React.FC<MacroPanelProps> = ({ isOpen, onClose, macroData, currentStepIndex = -1 }) => {
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
        <Paper 
          elevation={1} 
          sx={{ 
            p: 1.5, 
            mb: 2, 
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '1.5rem' }}>{macroData.prompt}</Typography>
        </Paper>
        
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Steps:</Typography>
        <Box sx={{ pl: 1, pr: 1 }}>
          {macroData.steps.map((step, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                opacity: index <= currentStepIndex ? 1 : 0.5,
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  backgroundColor: index === currentStepIndex ? 'secondary.main' : 'grey.100',
                  color: index === currentStepIndex ? 'secondary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    backgroundColor: index === currentStepIndex ? 'secondary.main' : 'grey.100',
                    left: '-5px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                  }
                }}
              >
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: '1.25rem' }}>
                  {step.message || `Executing ${step.type}`}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default MacroPanel; 