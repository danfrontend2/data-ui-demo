import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import Chat from './components/Chat';
import { Layout } from 'react-grid-layout';
import { GridItem } from './types';
import ActionManager from './services/ActionManager';
import { DEMO_MACRO } from './types/actions';
import './App.css';

function App() {
  const [items, setItems] = useState<GridItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      w: 6,  // Half width
      h: 8   // Reduced height (33% less than 12)
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

  const handleExecuteMacro = async (macro: any): Promise<void> => {
    try {
      // First close all existing elements
      const itemIds = items.map(item => item.i);
      itemIds.forEach(id => {
        actionManager.logAction('REMOVE_GRID', { itemId: id });
      });

      // Then execute new macro
      await actionManager.executeMacro(macro.steps);
    } catch (error) {
      console.error('Error executing macro:', error);
      throw error;
    }
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

  const handleArrangeItems = (columns: number) => {
    const itemWidth = Math.floor(12 / columns);
    const newItems = items.map((item, index) => ({
      ...item,
      w: itemWidth,
      h: 9,
      x: (index % columns) * itemWidth,
      y: Math.floor(index / columns) * 9
    }));
    
    // Update items through action manager
    actionManager.logAction('UPDATE_LAYOUT', { 
      layout: newItems.map(item => ({
        i: item.i,
        w: item.w,
        h: item.h,
        x: item.x,
        y: item.y
      }))
    });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar 
          onAddItem={handleAddItem} 
          onRunMacro={handleRunMacro}
          onCloseAll={handleCloseAll}
          onRunCustomMacro={(steps: any[]) => actionManager.executeMacro(steps)}
          onArrangeItems={handleArrangeItems}
        />
        <GridLayout 
          items={items}
          onRemoveItem={handleRemoveItem}
          onAddChart={handleAddChart}
          onLayoutChange={handleLayoutChange}
        />
        
        {/* Chat component */}
        {isChatOpen && (
          <Chat
            onClose={() => setIsChatOpen(false)}
            onExecuteMacro={handleExecuteMacro}
          />
        )}
      </Box>
    </Box>
  );
}

export default App; 