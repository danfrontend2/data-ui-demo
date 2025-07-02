import React, { useState } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import { Layout } from 'react-grid-layout';
import { GridItem } from './types';
import './App.css';

function App() {
  const [items, setItems] = useState<GridItem[]>([]);

  const handleAddItem = (newItem: Layout) => {
    const gridItem: GridItem = {
      ...newItem,
      type: 'grid',
      data: undefined // Let GridLayout use its default data
    };
    setItems(prev => [...prev, gridItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.i !== itemId));
  };

  const handleAddChart = (chartItem: GridItem) => {
    setItems(prev => [...prev, chartItem]);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar onAddItem={handleAddItem} />
        <GridLayout 
          items={items} 
          onRemoveItem={handleRemoveItem}
          onAddChart={handleAddChart}
        />
      </Box>
    </Box>
  );
}

export default App; 