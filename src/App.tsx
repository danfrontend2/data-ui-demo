import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Toolbar from './components/Toolbar';
import GridLayout from './components/GridLayout';
import Chat from './components/Chat';
import MacroPanel from './components/MacroPanel';
import { Layout } from 'react-grid-layout';
import { GridItem } from './types';
import ActionManager from './services/ActionManager';
import { DEMO_MACRO, Action, MacroData } from './types/actions';
import './App.css';

function App() {
  const [items, setItems] = useState<GridItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMacroPanelOpen, setIsMacroPanelOpen] = useState(false);
  const [currentMacro, setCurrentMacro] = useState<MacroData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isMacroPlaying, setIsMacroPlaying] = useState(false);
  const actionManager = ActionManager.getInstance();

  useEffect(() => {
    // Set items handler in ActionManager
    actionManager.setItemsHandler(setItems);
    // Set step change handler in ActionManager
    actionManager.setStepChangeHandler(setCurrentStepIndex);
    // Set play state handler
    actionManager.setPlayStateHandler(setIsMacroPlaying);
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
      // Reset step index
      setCurrentStepIndex(-1);
      
      console.log('handleExecuteMacro received macro:', macro);
      console.log('macro.steps:', macro.steps);
      console.log('macro.steps type:', typeof macro.steps);
      console.log('macro.steps is Array:', Array.isArray(macro.steps));
      
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

  const handleMacroLoad = (macroData: MacroData) => {
    // Check if START action exists at the beginning, if not add it
    const updatedSteps = [...macroData.steps];
    if (updatedSteps.length > 0 && updatedSteps[0].type !== 'START') {
      const startAction: Action = {
        id: `start_${Date.now()}`,
        timestamp: Date.now(),
        type: 'START',
        details: {},
        message: 'Starting macro execution...'
      };
      updatedSteps.unshift(startAction);
    }
    
    const updatedMacroData: MacroData = {
      ...macroData,
      steps: updatedSteps
    };
    
    setCurrentMacro(updatedMacroData);
    
    // Only open panel if show_panel is not explicitly false
    const shouldShowPanel = macroData.show_panel !== false;
    setIsMacroPanelOpen(shouldShowPanel);
    setCurrentStepIndex(-1); // Reset step index when loading new macro
  };

  const handlePlayPauseMacro = () => {
    if (isMacroPlaying) {
      // Pause execution
      actionManager.pauseMacroExecution();
    } else {
      // Resume or start execution
      if (currentStepIndex === -1 && currentMacro) {
        // Start from beginning
        handleExecuteMacro(currentMacro);
      } else {
        // Resume from current position
        actionManager.resumeMacroExecution();
      }
    }
  };

  const handleNextStep = () => {
    actionManager.executeNextStep();
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow step clicks when macro is paused or not running
    if (currentMacro && !isMacroPlaying) {
      console.log(`Executing up to step ${stepIndex}`);
      actionManager.executeUpToStep(currentMacro.steps, stepIndex);
    }
  };

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <MacroPanel
        isOpen={isMacroPanelOpen}
        onClose={() => setIsMacroPanelOpen(false)}
        macroData={currentMacro}
        currentStepIndex={currentStepIndex}
        isPlaying={isMacroPlaying}
        onPlayPause={handlePlayPauseMacro}
        onNextStep={handleNextStep}
        onStepClick={handleStepClick}
      />
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          mr: isMacroPanelOpen ? '400px' : 0,
          transition: 'margin-right 0.3s ease-in-out',
          overflow: 'hidden'
        }}
      >
        <Toolbar 
          onAddItem={handleAddItem} 
          onRunMacro={handleRunMacro}
          onCloseAll={handleCloseAll}
          onCloseMacroPanel={() => setIsMacroPanelOpen(false)}
          onRunCustomMacro={(steps: any[]) => actionManager.executeMacro(steps)}
          onArrangeItems={handleArrangeItems}
          onMacroLoad={handleMacroLoad}
          items={items}
        />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <GridLayout 
            items={items}
            onRemoveItem={handleRemoveItem}
            onAddChart={handleAddChart}
            onLayoutChange={handleLayoutChange}
          />
        </Box>
        
        {/* Chat component */}
        {isChatOpen && (
          <Chat
            onClose={() => setIsChatOpen(false)}
            onExecuteMacro={handleExecuteMacro}
            onMacroLoad={handleMacroLoad}
          />
        )}
      </Box>
    </Box>
  );
}

export default App; 