import React, { useState } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import { LayoutItem } from './types';
import './App.css';

function App() {
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
  
  const handleAddGrid = () => {
    const newItem: LayoutItem = {
      i: `grid-${Date.now()}`,
      x: (layoutItems.length * 2) % 12,
      y: Infinity, // puts it at the bottom
      w: 6,
      h: 4,
    };
    setLayoutItems([...layoutItems, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    console.log('App: handleRemoveItem triggered');
    console.log('Current items:', layoutItems);
    console.log('Removing item with ID:', itemId);
    const updatedItems = layoutItems.filter(item => item.i !== itemId);
    console.log('Updated items:', updatedItems);
    setLayoutItems(updatedItems);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Toolbar onAddGrid={handleAddGrid} />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <GridLayout 
          items={layoutItems} 
          onRemoveItem={handleRemoveItem}
        />
      </Box>
    </Box>
  );
}

export default App; 