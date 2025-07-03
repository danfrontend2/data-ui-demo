import React, { useState, useRef } from 'react';
import { Box, Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import { Layout } from 'react-grid-layout';
import Chat from './Chat';
import ActionManager from '../services/ActionManager';

// Counter for unique IDs
let idCounter = 0;

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
  onRunMacro: () => void;
  onRunCustomMacro: (macro: any[]) => void;
  onCloseAll: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem, onRunMacro, onRunCustomMacro, onCloseAll }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  const handleStopRecording = async () => {
    setIsRecording(false);
    const macro = ActionManager.getInstance().stopRecording();
    
    // Create a file name with timestamp
    const fileName = `macro_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    try {
      // Save macro to file
      const blob = new Blob([JSON.stringify(macro, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
          const macro = JSON.parse(e.target?.result as string);
          console.log('Parsed macro:', macro);
          onRunCustomMacro(macro);
        } catch (error) {
          console.error('Failed to parse macro file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
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
  );
};

export default Toolbar; 