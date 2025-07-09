import React, { useState, useRef, useEffect } from 'react';
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar as MuiToolbar,
  Tooltip,
  Slider,
  Box,
  Popover,
  Typography
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';

import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Layout } from 'react-grid-layout';
import { GridItem } from '../types';
import { Action, MacroData } from '../types/actions';
import Chat from './Chat';
import ChartSettings from './ChartSettings';
import PromptsMenu from './PromptsMenu';
import ActionManager from '../services/ActionManager';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
  onRunMacro: () => void;
  onCloseAll: () => void;
  onCloseMacroPanel: () => void;
  onRunCustomMacro: (steps: Action[]) => void;
  onArrangeItems: (columns: number) => void;
  onMacroLoad: (macroData: MacroData) => void;
  onPromptSelect?: (prompt: string) => void;
  items: GridItem[];
  isMacroPanelOpen?: boolean;
}

const tooltipProps = {
  componentsProps: {
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
  }
};

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onRunMacro, onRunCustomMacro, onCloseAll, onCloseMacroPanel, onArrangeItems, onMacroLoad, onPromptSelect, items, isMacroPanelOpen }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recordedMacro, setRecordedMacro] = useState<Action[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<number>(2);
  const [arrangeAnchorEl, setArrangeAnchorEl] = useState<HTMLElement | null>(null);
  const [isAnimatingArrange, setIsAnimatingArrange] = useState(false);
  const dummyButtonRef = useRef<HTMLButtonElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<string | undefined>();
  const [chatMessage, setChatMessage] = useState('');
  const [shouldAutoSend, setShouldAutoSend] = useState(false);
  const actionManager = ActionManager.getInstance();

  // Animate arrange slider change
  const animateArrangeSlider = async (targetColumns: number, duration: number = 1000) => {
    setIsAnimatingArrange(true);
    const startColumns = columns;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = (targetColumns - startColumns) / steps;

    for (let i = 0; i <= steps; i++) {
      const newValue = Math.round(startColumns + (increment * i));
      setColumns(newValue);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    setIsAnimatingArrange(false);
  };

  const handleAddItem = () => {
    onAddItem({
      i: `grid_${Math.random().toString(36).substr(2, 9)}`,
      x: 0,
      y: 0,
      w: 12,
      h: 12
    });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    actionManager.startRecording();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const macro = actionManager.stopRecording();
    setRecordedMacro(macro);
    setIsPromptDialogOpen(true);
  };

  const handleSaveMacro = () => {
    setIsPromptDialogOpen(false);
    
    // Create macro object with prompt
    const macroWithPrompt = {
      prompt,
      steps: recordedMacro
    };
    
    // Create a file name with timestamp
    const fileName = `macro_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    try {
      // Save macro to file
      const blob = new Blob([JSON.stringify(macroWithPrompt, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Clear prompt
      setPrompt('');
    } catch (error) {
      console.error('Failed to save macro:', error);
    }
  };

  const handleLoadMacro = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('File content:', e.target?.result);
          const macroData = JSON.parse(e.target?.result as string);
          console.log('Parsed macro:', macroData);
          console.log('macroData.steps type:', typeof macroData.steps);
          console.log('macroData.steps is Array:', Array.isArray(macroData.steps));
          console.log('macroData.steps:', macroData.steps);
          
          if (!macroData.steps || !macroData.prompt) {
            throw new Error('Invalid macro format: file must contain both prompt and steps');
          }
          
          console.log('Macro prompt:', macroData.prompt);
          console.log('About to call onRunCustomMacro with:', macroData.steps);
          onRunCustomMacro(macroData.steps);
          onMacroLoad(macroData);
          
          // Reset input value so the same file can be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Failed to parse macro file:', error);
          alert('Invalid macro file format. File must contain both prompt and steps.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleArrangeClick = (event: React.MouseEvent<HTMLElement>) => {
    setArrangeAnchorEl(event.currentTarget);
  };

  const handleArrangeClose = () => {
    setArrangeAnchorEl(null);
  };

  const handleArrange = () => {
    onArrangeItems(columns);
    handleArrangeClose();
  };

  // Handle close all - close dialogs and items
  const handleCloseAll = () => {
    // Close all dialogs first
    setIsChatOpen(false);
    setIsSettingsOpen(false);
    setIsPromptDialogOpen(false);
    handleArrangeClose();
    onCloseMacroPanel();
    
    // Then close all items
    onCloseAll();
  };

  // Add click handler for charts
  const handleChartClick = (chartId: string) => {
    if (isSettingsOpen) {
      setSelectedChartId(chartId);
    }
  };

  useEffect(() => {
    // Add click event listener to chart containers
    const handleClick = (event: MouseEvent) => {
      const chartContainer = (event.target as HTMLElement).closest('.react-grid-item');
      if (chartContainer) {
        const chartId = chartContainer.querySelector('[id^="chart-"]')?.id;
        if (chartId) {
          handleChartClick(chartId.replace('chart-', ''));
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isSettingsOpen, handleChartClick]);

  // Set up AI chat handler in ActionManager
  useEffect(() => {
    actionManager.setAIChatHandler((message: string, autoSend?: boolean) => {
      // Open chat if not already open
      if (!isChatOpen) {
        setIsSettingsOpen(false);
        setIsChatOpen(true);
      }
      
      // Set the message and optionally auto-send it
      // We'll need to pass this to Chat component
      setChatMessage(message);
      if (autoSend) {
        setShouldAutoSend(true);
      }
    });

    // Set up chart settings handler in ActionManager
    actionManager.setChartSettingsHandler((chartId?: string) => {
      // Close chat if open
      setIsChatOpen(false);
      // Open chart settings
      setIsSettingsOpen(true);
      // Select the specific chart if provided
      if (chartId) {
        setSelectedChartId(chartId);
      }
    });

    // Set up arrange settings handler in ActionManager
    actionManager.setArrangeSettingsHandler(async (targetColumns: number) => {
      // Close other panels
      setIsChatOpen(false);
      setIsSettingsOpen(false);
      
      // Open arrange popover using dummy button as anchor
      if (dummyButtonRef.current) {
        setArrangeAnchorEl(dummyButtonRef.current);
        // Wait for popover to open
        await new Promise(resolve => setTimeout(resolve, 200));
        // Animate slider to target value
        await animateArrangeSlider(targetColumns, 800);
      }
    });

    // Set up close handlers in ActionManager
    actionManager.setCloseChartSettingsHandler(() => {
      setIsSettingsOpen(false);
    });

    actionManager.setCloseArrangeSettingsHandler(() => {
      setArrangeAnchorEl(null);
    });
  }, [isChatOpen, actionManager, animateArrangeSlider]);

  // When settings panel is closed, reset selected chart
  useEffect(() => {
    if (!isSettingsOpen) {
      setSelectedChartId(undefined);
    } else if (!selectedChartId) {
      // Only select first chart if no chart is currently selected
      const firstChart = items.find(item => 
        item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart'
      );
      if (firstChart) {
        setSelectedChartId(firstChart.i);
      }
    }
  }, [isSettingsOpen, items, selectedChartId]);

  return (
    <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <MuiToolbar>
        <Tooltip 
          title="Add new grid" 
          {...tooltipProps}
        >
          <Button color="primary" onClick={handleAddItem}>
            <AddIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Chart Settings"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={() => {
              if (isSettingsOpen) {
                setIsSettingsOpen(false);
              } else {
                setIsChatOpen(false);
                setIsSettingsOpen(true);
              }
            }}
          >
            <SettingsIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Arrange items"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={handleArrangeClick}
          >
            <GridViewIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title={isRecording ? "Stop recording" : "Start recording"}
          {...tooltipProps}
        >
          <Button 
            color="primary" 
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? <FiberManualRecordIcon sx={{ color: 'red' }} /> : <FiberManualRecordIcon />}
          </Button>
        </Tooltip>
        <Tooltip 
          title="Run macro from file"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlayArrowIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Open AI Assistant"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={() => {
              if (isChatOpen) {
                setIsChatOpen(false);
              } else {
                setIsSettingsOpen(false);
                setIsChatOpen(true);
              }
            }}
          >
            <SmartToyIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Close all items"
          {...tooltipProps}
        >
          <Button color="error" onClick={handleCloseAll}>
            <CloseIcon />
          </Button>
        </Tooltip>
        <PromptsMenu 
          onRunMacro={onRunCustomMacro}
          onMacroLoad={onMacroLoad}
          onPromptSelect={onPromptSelect}
        />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLoadMacro}
          accept=".json"
        />
        {/* Invisible button for arrange popover anchor */}
        <button
          ref={dummyButtonRef}
          style={{ 
            position: 'absolute', 
            opacity: 0, 
            pointerEvents: 'none',
            left: '200px',
            top: '20px'
          }}
        />

        <Popover
          open={Boolean(arrangeAnchorEl)}
          anchorEl={arrangeAnchorEl}
          onClose={handleArrangeClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Arrange Items
            </Typography>
            <Box 
              sx={{ 
                mb: 2,
                '& .MuiSlider-root': {
                  transition: 'all 0.3s ease',
                  ...(isAnimatingArrange ? {
                    '& .MuiSlider-thumb': {
                      boxShadow: '0 0 15px rgba(103, 126, 234, 0.7)',
                      backgroundColor: '#677eea',
                      transform: 'scale(1.2)',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#677eea',
                      boxShadow: '0 0 10px rgba(103, 126, 234, 0.3)',
                    }
                  } : {})
                }
              }}
            >
              <Slider
                value={columns}
                min={1}
                max={4}
                step={1}
                marks
                onChange={(_, value) => !isAnimatingArrange && setColumns(value as number)}
                disabled={isAnimatingArrange}
              />
            </Box>
            <Button 
              variant="contained" 
              onClick={handleArrange}
              fullWidth
              disabled={isAnimatingArrange}
              sx={{
                ...(isAnimatingArrange ? {
                  backgroundColor: '#677eea',
                  boxShadow: '0 0 10px rgba(103, 126, 234, 0.3)',
                } : {})
              }}
            >
              {isAnimatingArrange ? 'Arranging...' : `Arrange (${columns} columns)`}
            </Button>
          </Box>
        </Popover>

        {/* Chat component */}
        {isChatOpen && (
          <Chat
            onClose={() => setIsChatOpen(false)}
            onExecuteMacro={async (macro: Action[]) => onRunCustomMacro(macro)}
            onMacroLoad={onMacroLoad}
            prefilledMessage={chatMessage}
            shouldAutoSend={shouldAutoSend}
            onMessageSent={() => {
              setChatMessage('');
              setShouldAutoSend(false);
            }}
          />
        )}

        {/* Prompt Dialog */}
        <Dialog open={isPromptDialogOpen} onClose={() => setIsPromptDialogOpen(false)}>
          <DialogTitle>Save Macro</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Prompt"
              fullWidth
              variant="outlined"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              rows={4}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsPromptDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMacro} startIcon={<SaveIcon />}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Chart Settings component */}
        {isSettingsOpen && (
          <ChartSettings
            onClose={() => setIsSettingsOpen(false)}
            items={items}
            selectedChartId={selectedChartId}
            isMacroPanelOpen={isMacroPanelOpen}
          />
        )}
      </MuiToolbar>
    </AppBar>
  );
};

export default Toolbar; 