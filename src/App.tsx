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
    // Register action handlers
    actionManager.registerHandler('ADD_GRID', ({ item }) => {
      setItems(prev => [...prev, item]);
    });

    actionManager.registerHandler('REMOVE_GRID', ({ itemId }) => {
      setItems(prev => prev.filter(item => item.i !== itemId));
    });

    actionManager.registerHandler('UPDATE_LAYOUT', ({ layout }) => {
      console.log('UPDATE_LAYOUT received:', layout);
      console.log('Current items:', items);

      setItems(prev => {
        // Create a map of current items for quick lookup
        const currentItems = new Map(prev.map(item => [item.i, item]));
        console.log('Current items map:', currentItems);
        
        // Update each item in the layout
        const updatedItems = layout.map((layoutItem: Layout) => {
          const currentItem = currentItems.get(layoutItem.i);
          console.log(`Processing item ${layoutItem.i}:`, { 
            layoutItem, 
            currentItem,
            currentItemType: currentItem?.type
          });
          
          if (!currentItem) {
            console.warn(`No current item found for ${layoutItem.i}, this should not happen`);
            return {
              ...layoutItem,
              type: 'grid' // Default type if no current item found
            } as GridItem;
          }
          
          // Keep all properties from current item and only update layout-related ones
          const updatedItem = {
            ...currentItem,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
          console.log('Updated item:', updatedItem);
          return updatedItem;
        });

        // Sort items by y coordinate to maintain order
        const sortedItems = updatedItems.sort((a: GridItem, b: GridItem) => a.y - b.y);
        console.log('Final sorted items with types:', sortedItems.map((item: GridItem) => ({ 
          id: item.i, 
          type: item.type 
        })));
        return sortedItems;
      });
    });

    actionManager.registerHandler('ADD_CHART', ({ item, sourceGridId, selectedRange }) => {
      if (sourceGridId && selectedRange) {
        const gridApi = window.gridApis[sourceGridId];
        if (gridApi) {
          const chartData: ChartDataPoint[] = [];
          const { columns, startRow, endRow } = selectedRange;
          const xField = columns[0];  // First column is for categories

          gridApi.forEachNodeAfterFilterAndSort((node: any) => {
            const rowIndex = node.rowIndex;
            if (rowIndex !== null && rowIndex !== undefined && 
                rowIndex >= startRow && 
                rowIndex <= endRow) {
              const point: ChartDataPoint = {
                category: String(node.data[xField])
              };
              
              // Add values for each Y-axis column
              columns.slice(1).forEach((field: string) => {
                const value = parseFloat(node.data[field]);
                if (!isNaN(value)) {
                  point[field] = value;
                }
              });
              
              chartData.push(point);
            }
          });

          // Update the item with the chart data
          const updatedItem = {
            ...item,
            chartData
          };
          setItems(prev => [...prev, updatedItem]);
        } else {
          console.warn('Grid API not found for sourceGridId:', sourceGridId);
        }
      } else {
        setItems(prev => [...prev, item]);
      }
    });

    actionManager.registerHandler('SELECT_RANGE', async ({ gridId, range }) => {
      // Wait for grid to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the grid API and select the range
      const gridApi = window.gridApis[gridId];
      if (gridApi) {
        // First clear any existing selection
        gridApi.deselectAll();
        
        // Then create a range selection
        const allColumns = gridApi.getColumnDefs();
        if (allColumns) {
          const columnIds = allColumns.map((col: any) => col.field);
          gridApi.addCellRange({
            rowStartIndex: 0,
            rowEndIndex: 9,
            columns: columnIds
          });
        }

        // Clear selection after a short delay
        setTimeout(() => {
          gridApi.deselectAll();
          gridApi.clearRangeSelection();
        }, 500);
      }
    });
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
    ActionManager.getInstance().logAction('ADD_GRID', {
      item: gridItem
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const item = items.find(i => i.i === itemId);
    setItems(prev => prev.filter(item => item.i !== itemId));
    actionManager.logAction('REMOVE_GRID', { itemId, item });
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
    // Update items state with new layout
    setItems(prev => {
      const newItems = prev.map(item => {
        const layoutItem = layout.find(l => l.i === item.i);
        if (!layoutItem) return item;
        
        return {
          ...item,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      });
      return newItems;
    });

    // Log the layout update
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