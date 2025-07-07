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
  Popover
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Layout } from 'react-grid-layout';
import { GridItem } from '../types';
import { Action } from '../types/actions';
import Chat from './Chat';
import ChartSettings from './ChartSettings';
import ActionManager from '../services/ActionManager';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
  onRunMacro: () => void;
  onCloseAll: () => void;
  onRunCustomMacro: (steps: Action[]) => void;
  onArrangeItems: (columns: number) => void;
  onMacroLoad: (macroData: { prompt: string; steps: Action[] }) => void;
  items: GridItem[];
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

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onRunMacro, onRunCustomMacro, onCloseAll, onArrangeItems, onMacroLoad, items }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recordedMacro, setRecordedMacro] = useState<Action[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<number>(2);
  const [arrangeAnchorEl, setArrangeAnchorEl] = useState<HTMLElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<string | undefined>();
  const actionManager = ActionManager.getInstance();

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
          
          if (!macroData.steps || !macroData.prompt) {
            throw new Error('Invalid macro format: file must contain both prompt and steps');
          }
          
          console.log('Macro prompt:', macroData.prompt);
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
  }, [isSettingsOpen]);

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
  }, [isSettingsOpen]); // Remove items dependency

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
          <Button color="error" onClick={onCloseAll}>
            <CloseIcon />
          </Button>
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLoadMacro}
          accept=".json"
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
            <Box sx={{ mb: 2 }}>
              <Slider
                value={columns}
                min={1}
                max={4}
                step={1}
                marks
                onChange={(_, value) => setColumns(value as number)}
              />
            </Box>
            <Button 
              variant="contained" 
              onClick={handleArrange}
              fullWidth
            >
              Arrange ({columns} columns)
            </Button>
          </Box>
        </Popover>

        {/* Chat component */}
        {isChatOpen && (
          <Chat
            onClose={() => setIsChatOpen(false)}
            onExecuteMacro={async (macro: Action[]) => onRunCustomMacro(macro)}
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
          />
        )}
      </MuiToolbar>
    </AppBar>
  );
};

export default Toolbar; 