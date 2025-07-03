import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import { Layout } from 'react-grid-layout';
import Chat from './Chat';
import ActionManager from '../services/ActionManager';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
  onRunMacro: () => void;
  onRunCustomMacro: (macro: any[]) => void;
  onCloseAll: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onRunMacro, onRunCustomMacro, onCloseAll }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [recordedMacro, setRecordedMacro] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    // Use UUID v4 for guaranteed uniqueness
    const id = `grid_${Math.random().toString(36).substr(2, 9)}`;
    
    onAddItem({
      i: id,
      x: 0,
      y: Infinity, // Put it at the bottom
      w: 12, // Full width
      h: 8,
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
    <>
      <Box sx={{ 
        padding: 2,
        display: 'flex',
        gap: 2,
        position: 'relative'
      }}>
        <Button variant="contained" onClick={addItem}>
          Add Grid
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={() => setIsChatOpen(!isChatOpen)}
          startIcon={<SmartToyIcon />}
        >
          AI
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onRunMacro}
          startIcon={<PlayArrowIcon />}
        >
          Run Demo
        </Button>
        {!isRecording ? (
          <Button
            variant="contained"
            color="error"
            onClick={handleStartRecording}
            startIcon={<FiberManualRecordIcon />}
          >
            Record Macro
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleStopRecording}
            startIcon={<SaveIcon />}
          >
            Save Macro
          </Button>
        )}
        <input
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleLoadMacro}
        />
        <Button
          variant="contained"
          color="info"
          onClick={() => fileInputRef.current?.click()}
          startIcon={<UploadIcon />}
        >
          Load Macro
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onCloseAll}
          startIcon={<CloseIcon />}
        >
          Close All
        </Button>
        {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />}
      </Box>

      <Dialog 
        open={isPromptDialogOpen} 
        onClose={() => setIsPromptDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Macro Description</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={3}
            margin="dense"
            label="What does this macro do?"
            fullWidth
            variant="outlined"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPromptDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMacro} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Toolbar; 