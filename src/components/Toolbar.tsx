import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Layout } from 'react-grid-layout';
import Chat from './Chat';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const addItem = () => {
    const id = new Date().getTime().toString();
    onAddItem({
      i: id,
      x: 0,
      y: Infinity, // Put it at the bottom
      w: 12, // Full width
      h: 8,
    });
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
      {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />}
    </Box>
  );
};

export default Toolbar; 