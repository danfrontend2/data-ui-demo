import React, { useState } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import { Layout } from 'react-grid-layout';
import './App.css';

interface GridItem extends Layout {
  data?: any[];
}

function App() {
  const [items, setItems] = useState<GridItem[]>([]);

  const handleAddItem = (newItem: Layout) => {
    const gridItem: GridItem = {
      ...newItem,
      data: undefined // Let GridLayout use its default data
    };
    setItems(prev => [...prev, gridItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.i !== itemId));
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar onAddItem={handleAddItem} />
        <GridLayout items={items} onRemoveItem={handleRemoveItem} />
      </Box>
    </Box>
  );
}

export default App; 