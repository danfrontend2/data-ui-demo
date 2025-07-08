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

interface PromptOption {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

interface PromptsMenuProps {
  onPromptSelect?: (prompt: string) => void;
}

const PromptsMenu: React.FC<PromptsMenuProps> = ({ onPromptSelect }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [promptOptions, setPromptOptions] = useState<PromptOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const open = Boolean(anchorEl);

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
            prompt: macroData.prompt
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

  const handlePromptSelect = (prompt: string) => {
    if (onPromptSelect) {
      onPromptSelect(prompt);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip 
        title="Select macro for demo"
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
            Select macro for demo
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
                onClick={() => handlePromptSelect(promptOption.prompt)}
                sx={{
                  px: 2,
                  py: 1.5,
                  minHeight: 'auto',
                  alignItems: 'flex-start',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
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
                  {promptOption.prompt}
                </Typography>
              </MenuItem>
              {index < promptOptions.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
};

export default PromptsMenu; 