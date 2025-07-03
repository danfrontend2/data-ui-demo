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
          console.log(`Processing item ${layoutItem.i}:`, { layoutItem, currentItem });
          
          if (!currentItem) {
            console.log(`No current item found for ${layoutItem.i}, using layout item`);
            return layoutItem as GridItem;
          }
          
          // Preserve all properties except layout-related ones
          const { x, y, w, h, ...rest } = currentItem;
          const updatedItem = {
            ...rest,
            i: layoutItem.i,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
          console.log(`Updated item ${layoutItem.i}:`, updatedItem);
          return updatedItem;
        });

        // Sort items by y coordinate to maintain order
        const sortedItems = updatedItems.sort((a: GridItem, b: GridItem) => a.y - b.y);
        console.log('Final sorted items:', sortedItems);
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
    setItems(prev => {
      // Calculate the maximum Y coordinate of existing items
      const maxY = prev.reduce((max, item) => {
        const itemBottom = item.y + item.h;
        return itemBottom > max ? itemBottom : max;
      }, 0);

      // Create new grid item, preserving the width from newItem if provided
      const gridItem: GridItem = {
        ...newItem,
        type: 'grid',
        data: undefined,
        w: newItem.w || 12,  // Use provided width or default to 12
        h: newItem.h || 9,   // Use provided height or default to 9
        y: maxY             // Place new item below existing ones
      };

      // Create new layout preserving ALL properties of existing items
      const newLayout = [...prev, gridItem];

      // Log the layout update
      ActionManager.getInstance().logAction('UPDATE_LAYOUT', {
        layout: newLayout
      });

      return newLayout;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const item = items.find(i => i.i === itemId);
    setItems(prev => prev.filter(item => item.i !== itemId));
    actionManager.logAction('REMOVE_GRID', { itemId, item });
  };

  const handleAddChart = (chartItem: GridItem) => {
    setItems(prev => [...prev, chartItem]);
    actionManager.logAction('ADD_CHART', { item: chartItem });
  };

  const handleRunMacro = () => {
    actionManager.executeMacro(DEMO_MACRO);
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
        <Toolbar onAddItem={handleAddItem} onRunMacro={handleRunMacro} />
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