import React, { useState, useRef } from 'react';
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar as MuiToolbar,
  Tooltip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Layout } from 'react-grid-layout';
import Chat from './Chat';
import ActionManager from '../services/ActionManager';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
  onRunMacro: () => void;
  onRunCustomMacro: (macro: any[]) => void;
  onCloseAll: () => void;
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

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onRunMacro, onRunCustomMacro, onCloseAll }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recordedMacro, setRecordedMacro] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ActionManager.getInstance().startRecording();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    const macro = ActionManager.getInstance().stopRecording();
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
        } catch (error) {
          console.error('Failed to parse macro file:', error);
          alert('Invalid macro file format. File must contain both prompt and steps.');
        }
      };
      reader.readAsText(file);
    }
  };

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
          title="Load macro from file"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Open AI Assistant"
          {...tooltipProps}
        >
          <Button
            color="primary"
            onClick={() => setIsChatOpen(true)}
          >
            <SmartToyIcon />
          </Button>
        </Tooltip>
        <Tooltip 
          title="Close all grids"
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

        {/* Chat component */}
        {isChatOpen && (
          <Chat
            onClose={() => setIsChatOpen(false)}
            onExecuteMacro={async (macro: any) => onRunCustomMacro(macro.steps)}
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
      </MuiToolbar>
    </AppBar>
  );
};

export default Toolbar; 