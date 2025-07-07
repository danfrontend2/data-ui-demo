import React, { useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { ActionType, Action } from '../types/actions';

interface MacroPanelProps {
  isOpen: boolean;
  onClose: () => void;
  macroData: {
    prompt: string;
    steps: Action[];
  } | null;
  currentStepIndex?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onNextStep?: () => void;
}

// Kelly colors for different action types
const ACTION_COLORS: Record<ActionType, string> = {
  'ADD_GRID': '#FFB300', // vivid yellow
  'REMOVE_GRID': '#C10020', // vivid red
  'REMOVE_ALL_GRIDS': '#F13A13', // vivid reddish orange
  'UPDATE_LAYOUT': '#A6BDD7', // very light blue
  'UPDATE_CELL': '#CEA262', // grayish yellow
  'DROP_FILE': '#007D34', // vivid green
  'SELECT_RANGE': '#00538A', // strong blue
  'ADD_CHART': '#803E75', // strong purple
  'ARRANGE': '#93AA00', // vivid yellowish green
  'UPDATE_CHART_OPACITY': '#FF7A5C', // strong yellowish pink
  'UPDATE_CHART_STROKE_WIDTH': '#53377A', // strong violet
  'UPDATE_CHART_COLOR_SET': '#F6768E', // strong purplish pink
};

const MacroPanel: React.FC<MacroPanelProps> = ({ 
  isOpen, 
  onClose, 
  macroData, 
  currentStepIndex = -1,
  isPlaying = false,
  onPlayPause,
  onNextStep
}) => {
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const currentStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStepRef.current && stepsContainerRef.current) {
      currentStepRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentStepIndex]);

  if (!isOpen || !macroData) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '400px',
        backgroundColor: 'background.paper',
        boxShadow: -3,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          {onPlayPause && (
            <Tooltip title={!isPlaying ? "Play" : "Pause"}>
              <IconButton 
                onClick={onPlayPause} 
                size="small" 
                color="primary"
                sx={{ mr: 1 }}
              >
                {!isPlaying ? <PlayArrowIcon /> : <PauseIcon />}
              </IconButton>
            </Tooltip>
          )}
          {onNextStep && (
            <Tooltip title="Next step">
              <span>
                <IconButton 
                  onClick={onNextStep} 
                  size="small" 
                  color="primary"
                  disabled={isPlaying}
                >
                  <SkipNextIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box 
        ref={stepsContainerRef}
        sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 2
        }}
      >
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
          {macroData.steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const stepColor = ACTION_COLORS[step.type] || '#817066'; // medium gray as fallback
            
            return (
              <Box
                key={index}
                ref={isActive ? currentStepRef : null}
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
                    backgroundColor: isActive ? 'secondary.main' : stepColor,
                    opacity: isActive ? 1 : 0.8,
                    color: isActive ? 'secondary.contrastText' : '#000000',
                    borderRadius: 2,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      backgroundColor: isActive ? 'secondary.main' : stepColor,
                      opacity: isActive ? 1 : 0.8,
                      left: '-5px',
                      top: '50%',
                      transform: 'translateY(-50%) rotate(45deg)',
                    }
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-word', 
                      fontSize: '1.25rem',
                      textShadow: isActive ? 'none' : '0 1px 1px rgba(0,0,0,0.1)',
                      fontWeight: isActive ? 700 : 400
                    }}
                  >
                    {step.message || `Executing ${step.type}`}
                  </Typography>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default MacroPanel; 