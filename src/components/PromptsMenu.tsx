import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Tooltip,
  Divider
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import ChatIcon from '@mui/icons-material/Chat';
import { MacroData } from '../types/actions';

interface PromptOption {
  id: string;
  title: string;
  description: string;
  prompt: string;
  filename: string;
  macroData: any;
}

interface PromptsMenuProps {
  onPromptSelect?: (prompt: string) => void;
  onRunMacro?: (steps: any[]) => void;
  onMacroLoad?: (macroData: MacroData) => void;
}

const PromptsMenu: React.FC<PromptsMenuProps> = ({ onPromptSelect, onRunMacro, onMacroLoad }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const open = Boolean(anchorEl);

  // Generate beautiful gradient colors for menu items
  const getGradientColors = (index: number, hover: boolean = false) => {
    const gradients = [
      hover ? 'rgba(255, 107, 107, 0.25), rgba(255, 142, 83, 0.25)' : 'rgba(255, 107, 107, 0.15), rgba(255, 142, 83, 0.15)', // warm red-orange
      hover ? 'rgba(74, 144, 226, 0.25), rgba(80, 227, 194, 0.25)' : 'rgba(74, 144, 226, 0.15), rgba(80, 227, 194, 0.15)', // blue-teal
      hover ? 'rgba(247, 159, 31, 0.25), rgba(238, 205, 163, 0.25)' : 'rgba(247, 159, 31, 0.15), rgba(238, 205, 163, 0.15)', // golden
      hover ? 'rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25)' : 'rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15)', // purple-pink
      hover ? 'rgba(34, 197, 94, 0.25), rgba(101, 163, 13, 0.25)' : 'rgba(34, 197, 94, 0.15), rgba(101, 163, 13, 0.15)', // green
    ];
    return gradients[index % gradients.length];
  };

  // Load macros from public folder
  useEffect(() => {
    const loadMacros = async () => {
      setIsLoading(true);
      try {
        // Load index.json to get list of available macros
        const indexResponse = await fetch('/sample_macros/index.json');
        const indexData = await indexResponse.json();
        
        // Load each macro file
        const macroPromises = indexData.macros.map(async (filename: string) => {
          const response = await fetch(`/sample_macros/${filename}`);
          const macroData = await response.json();
          
          // Extract filename without extension for ID
          const id = filename.replace('.json', '');
          
          return {
            id,
            title: macroData.prompt,
            description: `Macro: ${id.replace(/[_-]/g, ' ')}`,
            prompt: macroData.prompt,
            filename,
            macroData
          };
        });
        
        const loadedMacros = await Promise.all(macroPromises);
        setPromptOptions(loadedMacros);
      } catch (error) {
        console.error('Error loading macros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMacros();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMacroSelect = (promptOption: PromptOption) => {
    // Run the macro if handlers are provided
    if (onRunMacro && onMacroLoad && promptOption.macroData) {
      onRunMacro(promptOption.macroData.steps);
      onMacroLoad(promptOption.macroData);
    } 
    // Fallback to old behavior if new handlers not provided
    else if (onPromptSelect) {
      onPromptSelect(promptOption.prompt);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip 
        title="Showtime: Select a Demo Macro"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: '#4caf50',
              color: 'white',
              fontSize: '1rem',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 500
            }
          }
        }}
      >
        <IconButton
          onClick={handleClick}
          size="small"
          color="primary"
          sx={{ 
            mr: 1,
            backgroundColor: open ? 'action.selected' : 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <MovieIcon 
            sx={{
              color: '#ff4444',
              fontSize: '1.5rem',
              '&:hover': {
                color: '#ff6666'
              }
            }}
          />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '1.1rem',
            fontWeight: 600
          }}>
            <ChatIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            Showtime: Select a Demo Macro
          </Typography>
        </Box>

{isLoading ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Loading macros...
            </Typography>
          </MenuItem>
        ) : (
          promptOptions.map((promptOption: PromptOption, index: number) => (
            <React.Fragment key={promptOption.id}>
              <MenuItem
                onClick={() => handleMacroSelect(promptOption)}
                sx={{
                  px: 2,
                  py: 1.5,
                  minHeight: 'auto',
                  alignItems: 'flex-start',
                  background: `linear-gradient(135deg, ${getGradientColors(index)})`,
                  borderRadius: '8px',
                  mb: 1,
                  mx: 1,
                  mt: index === 0 ? 2 : 0,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    background: `linear-gradient(135deg, ${getGradientColors(index, true)})`,
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Typography 
                  variant="body2"
                  sx={{ 
                    lineHeight: 1.4,
                    width: '100%',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }}
                >
                  {promptOption.prompt.charAt(0).toUpperCase() + promptOption.prompt.slice(1)}
                </Typography>
              </MenuItem>
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
};

export default PromptsMenu; 