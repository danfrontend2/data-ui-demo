import React from 'react';
import { Box, Button } from '@mui/material';
import { Layout } from 'react-grid-layout';

interface ToolbarProps {
  onAddItem: (item: Layout) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem }) => {
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
    <Box sx={{ padding: 2 }}>
      <Button variant="contained" onClick={addItem}>
        Add Grid
      </Button>
    </Box>
  );
};

export default Toolbar; 