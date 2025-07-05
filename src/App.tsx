import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import Chat from './components/Chat';
import MacroMessage from './components/MacroMessage';
import { Layout } from 'react-grid-layout';
import { GridItem } from './types';
import ActionManager from './services/ActionManager';
import { DEMO_MACRO } from './types/actions';
import './App.css';

function App() {
  const [items, setItems] = useState<GridItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [macroMessage, setMacroMessage] = useState<string | null>(null);
  const actionManager = ActionManager.getInstance();

  useEffect(() => {
    // Set items handler in ActionManager
    actionManager.setItemsHandler(setItems);
    // Set message handler in ActionManager
    actionManager.setMessageHandler(setMacroMessage);
  }, [actionManager]);

  // Update ActionManager items when items change
  useEffect(() => {
    actionManager.updateItems(items);
  }, [items, actionManager]);

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
    actionManager.logAction('REMOVE_ALL_GRIDS', {});
  };

  const handleLayoutChange = (layout: Layout[]) => {
    actionManager.logAction('UPDATE_LAYOUT', { layout });
  };

  const handleArrangeItems = (columns: number) => {
    actionManager.logAction('ARRANGE', { columns });
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

        {/* Macro message component */}
        <MacroMessage
          message={macroMessage}
          onClose={() => setMacroMessage(null)}
        />
      </Box>
    </Box>
  );
}

export default App; 