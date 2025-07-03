import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import { Layout } from 'react-grid-layout';
import { GridItem, ChartDataPoint } from './types';
import ActionManager from './services/ActionManager';
import { DEMO_MACRO } from './types/actions';
import './App.css';

function App() {
  const [items, setItems] = useState<GridItem[]>([]);
  const actionManager = ActionManager.getInstance();

  useEffect(() => {
    // Set items handler in ActionManager
    actionManager.setItemsHandler(setItems);
  }, [actionManager]);

  const handleAddItem = (newItem: Layout) => {
    // Calculate the maximum Y coordinate of existing items
    const maxY = items.reduce((max, item) => {
      const itemBottom = item.y + item.h;
      return itemBottom > max ? itemBottom : max;
    }, 0);

    // Create new grid item with fixed dimensions
    const gridItem: GridItem = {
      ...newItem,
      type: 'grid',
      data: undefined,
      x: 0,
      y: maxY,
      w: 12,  // Always full width
      h: 12   // Fixed height
    };

    // Log the action to add grid
    actionManager.logAction('ADD_GRID', {
      item: gridItem
    });
  };

  const handleRemoveItem = (itemId: string) => {
    actionManager.logAction('REMOVE_GRID', { itemId });
  };

  const handleAddChart = (chartItem: GridItem) => {
    actionManager.logAction('ADD_CHART', { item: chartItem });
  };

  const handleRunMacro = () => {
    actionManager.executeMacro(DEMO_MACRO);
  };

  const handleRunCustomMacro = (macro: any[]) => {
    console.log('Running custom macro:', macro);
    actionManager.executeMacro(macro);
  };

  const handleCloseAll = () => {
    // Get all item IDs and remove them one by one
    const itemIds = items.map(item => item.i);
    itemIds.forEach(id => {
      actionManager.logAction('REMOVE_GRID', { itemId: id });
    });
  };

  const handleLayoutChange = (layout: Layout[]) => {
    actionManager.logAction('UPDATE_LAYOUT', { layout });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar 
          onAddItem={handleAddItem} 
          onRunMacro={handleRunMacro}
          onRunCustomMacro={handleRunCustomMacro}
          onCloseAll={handleCloseAll}
        />
        <GridLayout 
          items={items}
          onRemoveItem={handleRemoveItem}
          onAddChart={handleAddChart}
          onLayoutChange={handleLayoutChange}
        />
      </Box>
    </Box>
  );
}

export default App; 