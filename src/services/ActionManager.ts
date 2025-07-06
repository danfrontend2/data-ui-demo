import { Action, ActionType } from '../types/actions';
import { GridItem } from '../types';
import { Layout } from 'react-grid-layout';
import { GridApi } from 'ag-grid-community';
import { SetStateAction } from 'react';

declare global {
  interface Window {
    gridApis: {
      [key: string]: GridApi;
    };
  }
}

type MessageCallback = (message: string | null) => void;

export default class ActionManager {
  private static instance: ActionManager;
  private actionHandlers: Record<string, (details: any) => void> = {};
  private actionLog: Action[] = [];
  private recording = false;
  private recordedActions: Action[] = [];
  private setItems: ((items: GridItem[]) => void) | null = null;
  private items: GridItem[] = [];
  private selectedData: any[] = [];
  private onMessage: ((message: string | null) => void) | null = null;

  private constructor() {
    console.log('Initializing ActionManager...');
    this.initializeHandlers();
  }

  static getInstance(): ActionManager {
    if (!ActionManager.instance) {
      ActionManager.instance = new ActionManager();
    }
    return ActionManager.instance;
  }

  setItemsHandler(handler: (items: GridItem[]) => void) {
    console.log('Setting items handler');
    this.setItems = handler;
    this.initializeHandlers();
  }

  updateItems(items: GridItem[]) {
    this.items = items;
  }

  private initializeHandlers() {
    if (!this.setItems) {
      console.warn('Items handler not set, skipping handlers initialization');
      return;
    }

    console.log('Initializing action handlers...');

    this.registerHandler('ADD_GRID', ({ item }) => {
      if (!this.setItems) return;
      const newItems = [...this.items, item];
      this.setItems(newItems);
    });

    this.registerHandler('REMOVE_GRID', ({ itemId }) => {
      if (!this.setItems) return;
      const newItems = this.items.filter(item => item.i !== itemId);
      this.setItems(newItems);
    });

    this.registerHandler('REMOVE_ALL_GRIDS', () => {
      if (!this.setItems) return;
      this.setItems([]);
    });

    this.registerHandler('UPDATE_LAYOUT', ({ layout }) => {
      if (!this.setItems) return;
      const currentItems = new Map(this.items.map(item => [item.i, item]));
      const updatedItems = layout.map((layoutItem: Layout) => {
        const currentItem = currentItems.get(layoutItem.i);
        if (!currentItem) return layoutItem as GridItem;
        return {
          ...currentItem,
          ...layoutItem
        };
      });
      this.setItems(updatedItems);
    });

    this.registerHandler('UPDATE_CELL', ({ gridId, rowId, field, newValue }) => {
      const gridApi = window.gridApis[gridId];
      if (gridApi) {
        // Find the row node
        let rowNode: any;
        gridApi.forEachNode(node => {
          if (node.data.id === rowId) {
            rowNode = node;
          }
        });

        if (rowNode) {
          // Update the cell value
          const newData = { ...rowNode.data, [field]: newValue };
          rowNode.setData(newData);
        }
      }
    });

    this.registerHandler('DROP_FILE', async ({ gridId, excelData }) => {
      console.log('DROP_FILE handler called with:', { gridId, excelData });
      
      // Wait for grid to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const gridApi = window.gridApis[gridId];
      console.log('Grid API:', gridApi);
      
      if (gridApi) {
        try {
          // First row is headers
          const headers = excelData[0] as string[];
          console.log('Original headers:', headers);

          // Create column definitions
          const columnDefs = [
            { field: 'id', hide: true },
            ...headers.map(header => {
              // Create a safe field name by removing special characters
              const safeField = header.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
              return {
                field: safeField,
                headerName: header,
                editable: true,
                type: typeof excelData[1][headers.indexOf(header)] === 'number' ? 'numericColumn' : undefined
              };
            })
          ];
          console.log('Column definitions:', columnDefs);

          // Convert array data to row objects
          const rowData = excelData.slice(1).map((row: any[], index: number) => {
            const obj: Record<string, any> = { id: (index + 1).toString() };
            headers.forEach((header, i) => {
              const safeField = header.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
              obj[safeField] = row[i];
            });
            return obj;
          });
          console.log('Row data:', rowData);

          // Update grid
          console.log('Updating grid with new data...');
          try {
            gridApi.setGridOption('columnDefs', columnDefs);
            gridApi.setGridOption('rowData', rowData);
            console.log('Grid updated successfully');
          } catch (error) {
            console.error('Error updating grid:', error);
          }
        } catch (error) {
          console.error('Error processing file data:', error);
        }
      } else {
        console.warn('Grid API not found for grid:', gridId);
        console.log('Available grid APIs:', window.gridApis);
      }
    });

    this.registerHandler('SELECT_RANGE', ({ gridId, startCell, endCell }) => {
      const gridApi = window.gridApis[gridId];
      if (gridApi) {
        // Get all rows data
        const rowData = gridApi.getRenderedNodes().map(node => node.data);
        if (!rowData) return;

        // Get column definitions
        const columnDefs = gridApi.getColumnDefs() as any[];
        const columns = columnDefs
          .filter(col => !col.hide && 'field' in col)
          .map(col => ({
            field: col.field as string,
            headerName: col.headerName as string
          }));

        // Extract selected data
        const startRow = Math.min(startCell.rowIndex, endCell.rowIndex);
        const endRow = Math.max(startCell.rowIndex, endCell.rowIndex);
        const selectedData = rowData.slice(startRow, endRow + 1);

        // Convert to chart format
        const chartData = selectedData.map((row: Record<string, any>) => {
          const point: Record<string, any> = {};
          columns.forEach(col => {
            if (col.field && col.headerName) {
              point[col.headerName] = row[col.field];
            }
          });
          return point;
        });

        // Store the selected data
        this.selectedData = chartData;
      }
    });

    this.registerHandler('ADD_CHART', ({ item }) => {
      if (!this.setItems) return;
      const newItems = [...this.items];
      const existingIndex = newItems.findIndex(i => i.i === item.i);
      if (existingIndex >= 0) {
        newItems[existingIndex] = item;
      } else {
        newItems.push(item);
      }
      this.setItems(newItems);
    });

    this.registerHandler('ARRANGE', ({ columns }: { columns: number }) => {
      if (!this.setItems) return;
      const itemWidth = Math.floor(12 / columns);
      const newItems = this.items.map((item: GridItem, index: number) => ({
        ...item,
        w: itemWidth,
        h: 9,
        x: (index % columns) * itemWidth,
        y: Math.floor(index / columns) * 9
      }));
      this.setItems(newItems);
    });

    this.registerHandler('UPDATE_CHART_OPACITY', ({ opacity, chartId }) => {
      if (!this.setItems || !this.items) return;
      
      const newItems = this.items.map(item => {
        if ((item.type === 'bar-chart' || item.type === 'pie-chart') && 
            (!chartId || item.i === chartId)) {
          return {
            ...item,
            chartConfig: {
              ...item.chartConfig,
              opacity
            }
          };
        }
        return item;
      });
      
      this.setItems(newItems);
    });

    this.registerHandler('UPDATE_CHART_STROKE_WIDTH', ({ strokeWidth, chartId }) => {
      if (!this.setItems || !this.items) return;
      
      const newItems = this.items.map(item => {
        if ((item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') && 
            (!chartId || item.i === chartId)) {
          return {
            ...item,
            chartConfig: {
              ...item.chartConfig,
              strokeWidth
            }
          };
        }
        return item;
      });
      
      this.setItems(newItems);
    });

    console.log('Action handlers initialized');
  }

  registerHandler(actionType: ActionType, handler: (details: any) => void) {
    console.log('Registering handler for:', actionType);
    this.actionHandlers[actionType] = handler;
  }

  clearHandlers() {
    this.actionHandlers = {};
  }

  hasHandler(actionType: ActionType): boolean {
    return !!this.actionHandlers[actionType];
  }

  logAction(type: ActionType, details: any) {
    console.log('Logging action:', { type, details });
    const action: Action = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      details
    };

    // Add default messages when recording
    if (this.recording) {
      switch (type) {
        case 'ADD_GRID':
          action.message = 'Adding a new data grid';
          break;
        case 'REMOVE_GRID':
          action.message = 'Removing the grid';
          break;
        case 'UPDATE_CELL':
          action.message = 'Updating cell value';
          break;
        case 'UPDATE_LAYOUT':
          action.message = 'Adjusting layout';
          break;
        case 'DROP_FILE':
          action.message = 'Loading data from file';
          break;
        case 'SELECT_RANGE':
          action.message = 'Selecting data range';
          break;
        case 'ADD_CHART':
          const chartType = details.item.type;
          switch (chartType) {
            case 'pie-chart':
              action.message = 'Adding a pie chart';
              break;
            case 'line-chart':
              action.message = 'Adding a line chart';
              break;
            case 'bar-chart':
              action.message = 'Adding a bar chart';
              break;
            default:
              action.message = 'Adding a new chart';
          }
          break;
      }
    }

    this.actionLog.push(action);

    if (this.recording) {
      this.recordedActions.push(action);
    }

    // Execute handler if exists
    const handler = this.actionHandlers[type];
    if (handler) {
      console.log('Executing handler for action:', type);
      handler(details);
    } else {
      console.warn('No handler registered for action:', type);
    }
  }

  startRecording() {
    this.recording = true;
    this.recordedActions = [];
  }

  stopRecording(): Action[] {
    this.recording = false;
    return this.recordedActions;
  }

  async executeMacro(actions: Action[]) {
    console.log('Starting macro execution with actions:', actions);
    for (const action of actions) {
      console.log('Executing step:', action);
      
      // Show message immediately before action
      if (this.onMessage && 'message' in action && action.message) {
        this.onMessage(action.message as string);
      }
      
      // Small delay before action
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const handler = this.actionHandlers[action.type];
      if (handler) {
        console.log('Handler found for action:', action.type);
        await handler(action.details);
      } else {
        console.warn('No handler found for action:', action.type);
      }

      // Pause for 2 seconds after action completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear message after the pause
      if (this.onMessage) {
        this.onMessage(null);
      }
    }
  }

  // Utility function to normalize field names
  private normalizeFieldName(field: string): string {
    return field.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
  }

  setMessageHandler(handler: MessageCallback) {
    this.onMessage = handler;
  }
} 