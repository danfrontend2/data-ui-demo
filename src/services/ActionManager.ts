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

export default class ActionManager {
  private static instance: ActionManager;
  private actionHandlers: { [key in ActionType]?: (details: any) => void } = {};
  private actionLog: Action[] = [];
  private isRecording: boolean = false;
  private recordedActions: Action[] = [];
  private setItems: ((value: SetStateAction<GridItem[]>) => void) | null = null;
  private selectedData: Record<string, any>[] = [];

  private constructor() {
    console.log('Initializing ActionManager...');
  }

  static getInstance(): ActionManager {
    if (!ActionManager.instance) {
      ActionManager.instance = new ActionManager();
    }
    return ActionManager.instance;
  }

  setItemsHandler(handler: (value: SetStateAction<GridItem[]>) => void) {
    console.log('Setting items handler');
    this.setItems = handler;
    this.initializeHandlers();
  }

  private initializeHandlers() {
    if (!this.setItems) {
      console.warn('Items handler not set, skipping handlers initialization');
      return;
    }

    console.log('Initializing action handlers...');

    this.registerHandler('ADD_GRID', ({ item }) => {
      this.setItems?.((prev: GridItem[]) => [...prev, item]);
    });

    this.registerHandler('REMOVE_GRID', ({ itemId }) => {
      this.setItems?.((prev: GridItem[]) => prev.filter(item => item.i !== itemId));
    });

    this.registerHandler('UPDATE_LAYOUT', ({ layout }) => {
      this.setItems?.((prev: GridItem[]) => {
        const currentItems = new Map(prev.map(item => [item.i, item]));
        const updatedItems = layout.map((layoutItem: Layout) => {
          const currentItem = currentItems.get(layoutItem.i);
          if (!currentItem) {
            return {
              ...layoutItem,
              type: 'grid'
            } as GridItem;
          }
          return {
            ...currentItem,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          };
        });
        return updatedItems.sort((a: GridItem, b: GridItem) => a.y - b.y);
      });
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
      if (!this.selectedData || !this.setItems) return;

      const chartItem: GridItem = {
        ...item,
        data: this.selectedData
      };

      // Update items through the handler
      this.setItems(prevItems => {
        const newItems = [...prevItems];
        const existingIndex = newItems.findIndex(i => i.i === item.i);
        if (existingIndex >= 0) {
          newItems[existingIndex] = chartItem;
        } else {
          newItems.push(chartItem);
        }
        return newItems;
      });
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

    this.actionLog.push(action);

    if (this.isRecording) {
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
    this.isRecording = true;
    this.recordedActions = [];
  }

  stopRecording(): Action[] {
    this.isRecording = false;
    return this.recordedActions;
  }

  async executeMacro(actions: Action[]) {
    console.log('Starting macro execution with actions:', actions);
    for (const action of actions) {
      console.log('Executing step:', action);
      
      // Small delay between actions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const handler = this.actionHandlers[action.type];
      if (handler) {
        console.log('Handler found for action:', action.type);
        await handler(action.details);
      } else {
        console.warn('No handler found for action:', action.type);
      }
    }
  }

  // Utility function to normalize field names
  private normalizeFieldName(field: string): string {
    return field.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
  }
} 