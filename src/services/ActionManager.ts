import { Action, ActionType } from '../types/actions';
import { GridItem } from '../types';
import { Layout } from 'react-grid-layout';
import { GridApi } from 'ag-grid-community';
import { SetStateAction } from 'react';
import { getActionMessage } from '../utils/messageUtils';

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
  private onStepChange?: (stepIndex: number) => void;
  private isExecuting = false;
  private currentStepIndex = -1;
  private currentMacro: { prompt: string; steps: Action[] } | null = null;
  private isPaused = false;
  private executionPromise: Promise<void> | null = null;
  private executionResolve: (() => void) | null = null;
  private onPlayStateChange?: (isPlaying: boolean) => void;
  private currentSteps: Action[] = [];
  private onOpenAIChat?: (message: string, autoSend?: boolean) => void;



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

    this.registerHandler('START', () => {
      // Clear all grids when starting a macro
      if (this.actionHandlers['REMOVE_ALL_GRIDS']) {
        this.actionHandlers['REMOVE_ALL_GRIDS']({});
      }
    });

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

    this.registerHandler('SELECT_RANGE', ({ gridId, startCell, endCell, range }) => {
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

        // Extract selected data - support both formats
        let startRow: number, endRow: number;
        
        if (range) {
          // New format: range object with startRow/endRow
          startRow = range.startRow;
          endRow = range.endRow;
        } else if (startCell && endCell && 
                   typeof startCell.rowIndex !== 'undefined' && 
                   typeof endCell.rowIndex !== 'undefined') {
          // Old format: startCell/endCell objects with rowIndex
          startRow = Math.min(startCell.rowIndex, endCell.rowIndex);
          endRow = Math.max(startCell.rowIndex, endCell.rowIndex);
        } else {
          console.error('Invalid SELECT_RANGE format: missing range or startCell/endCell');
          return;
        }

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

    this.registerHandler('UPDATE_CHART_COLOR_SET', ({ colorSet, chartId }) => {
      if (!this.setItems || !this.items) return;
      
      const newItems = this.items.map(item => {
        if ((item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') && 
            (!chartId || item.i === chartId)) {
          return {
            ...item,
            chartConfig: {
              ...item.chartConfig,
              colorSet
            }
          };
        }
        return item;
      });
      
      this.setItems(newItems);
    });

    this.registerHandler('OPEN_AI_CHAT', ({ message, autoSend = true }) => {
      if (this.onOpenAIChat) {
        this.onOpenAIChat(message, autoSend);
      }
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

    // Add message when recording
    if (this.recording) {
      action.message = getActionMessage(action);
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

  setStepChangeHandler(handler: (stepIndex: number) => void) {
    this.onStepChange = handler;
  }

  setPlayStateHandler(handler: (isPlaying: boolean) => void) {
    this.onPlayStateChange = handler;
  }

  setAIChatHandler(handler: (message: string, autoSend?: boolean) => void) {
    this.onOpenAIChat = handler;
  }

  private notifyMacroUpdate() {
    if (this.onStepChange) {
      this.onStepChange(this.currentStepIndex);
    }
  }

  private notifyPlayStateChange(isPlaying: boolean) {
    if (this.onPlayStateChange) {
      this.onPlayStateChange(isPlaying);
    }
  }

  async executeMacro(steps: Action[]) {
    if (this.isExecuting) {
      console.log('Already executing a macro');
      return;
    }
    
    console.log('ExecuteMacro called with steps:', steps);
    console.log('Steps type:', typeof steps);
    console.log('Steps is Array:', Array.isArray(steps));
    console.log('Steps length:', steps?.length);
          if (typeof steps === 'object' && steps !== null) {
        // If this is an object with steps field, take only the steps
        if ('steps' in steps && Array.isArray(steps.steps)) {
          steps = steps.steps;
        } else {
          // Otherwise convert object to array
          steps = Object.values(steps);
        }
      }
    // Add START action if it doesn't exist at the beginning
    const stepsToExecute = [...steps];
    if (stepsToExecute.length > 0 && stepsToExecute[0].type !== 'START') {
      const startAction: Action = {
        id: `start_${Date.now()}`,
        timestamp: Date.now(),
        type: 'START',
        details: {},
        message: 'Starting macro execution...'
      };
      stepsToExecute.unshift(startAction);
    }

    this.isExecuting = true;
    this.isPaused = false;
    this.currentStepIndex = -1;
    this.currentSteps = [...stepsToExecute]; // Store steps for next step execution
    this.notifyPlayStateChange(true); // Notify that macro is playing

    try {
      for (let i = 0; i < stepsToExecute.length; i++) {
        if (this.isPaused) {
          // Create a promise that will be resolved when resuming
          this.executionPromise = new Promise((resolve) => {
            this.executionResolve = resolve;
          });
          await this.executionPromise;
          this.executionPromise = null;
          this.executionResolve = null;
        }

        const step = stepsToExecute[i];
        this.currentStepIndex = i;
        this.notifyMacroUpdate();
        await this.executeStep(step);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between steps
      }
    } catch (error) {
      console.error('Error executing macro:', error);
      throw error;
    } finally {
      this.isExecuting = false;
      this.isPaused = false;
      this.executionPromise = null;
      this.executionResolve = null;
      this.notifyPlayStateChange(false); // Notify that macro is not playing
    }
  }

  async executeNextStep() {
    if (!this.isPaused || !this.currentSteps.length) {
      console.log('Cannot execute next step: not paused or no steps available');
      return;
    }

    const nextIndex = this.currentStepIndex + 1;
    if (nextIndex < this.currentSteps.length) {
      const step = this.currentSteps[nextIndex];
      this.currentStepIndex = nextIndex;
      this.notifyMacroUpdate();
      await this.executeStep(step);
      
      // If this was the last step, reset execution state
      if (nextIndex === this.currentSteps.length - 1) {
        this.isExecuting = false;
        this.isPaused = false;
        this.executionPromise = null;
        this.executionResolve = null;
        this.notifyPlayStateChange(false);
      }
    }
  }

  pauseMacroExecution() {
    if (this.isExecuting) {
      this.isPaused = true;
      this.notifyPlayStateChange(false);
    }
  }

  resumeMacroExecution() {
    if (this.isPaused && this.executionResolve) {
      this.isPaused = false;
      this.notifyPlayStateChange(true);
      this.executionResolve();
    }
  }

  // Utility function to normalize field names
  private normalizeFieldName(field: string): string {
    return field.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
  }

  setMessageHandler(handler: MessageCallback) {
    this.onMessage = handler;
  }

  private async executeStep(step: Action) {
    console.log('Executing step:', step);
    console.log('Step type:', step.type);
    console.log('Step details:', step.details);
    console.log('Available handlers:', Object.keys(this.actionHandlers));
    
    // Fix grid ID mismatches - replace generic IDs with actual grid IDs
    const fixedStep = this.fixGridIds(step);
    console.log('Fixed step:', fixedStep);
    
    // Always use generated message for consistency
    if (this.onMessage) {
      this.onMessage(getActionMessage(fixedStep));
    }
    
    const handler = this.actionHandlers[fixedStep.type];
    if (handler) {
      console.log('Handler found for action:', fixedStep.type);
      await handler(fixedStep.details);
    } else {
      console.warn('No handler found for action:', fixedStep.type);
      console.warn('Step with missing handler:', JSON.stringify(fixedStep, null, 2));
    }
  }

  private fixGridIds(step: Action): Action {
    // Get the first (and usually only) grid ID from current items
    const currentGridId = this.items.find(item => item.type === 'grid')?.i;
    
    if (!currentGridId) {
      return step; // No grid to fix
    }
    
    // Create a copy of the step to avoid modifying the original
    const fixedStep = JSON.parse(JSON.stringify(step));
    
    // Fix gridId references in SELECT_RANGE and other actions
    if (fixedStep.details.gridId && 
        (fixedStep.details.gridId === "1" || fixedStep.details.gridId === "2")) {
      console.log(`Fixing gridId from ${fixedStep.details.gridId} to ${currentGridId}`);
      fixedStep.details.gridId = currentGridId;
    }
    
    // Fix sourceGridId in ADD_CHART
    if (fixedStep.details.item?.sourceGridId && 
        (fixedStep.details.item.sourceGridId === "1" || fixedStep.details.item.sourceGridId === "2")) {
      console.log(`Fixing sourceGridId from ${fixedStep.details.item.sourceGridId} to ${currentGridId}`);
      fixedStep.details.item.sourceGridId = currentGridId;
    }
    
    return fixedStep;
  }

  async executeUpToStep(steps: Action[] | Record<string, Action>, targetStepIndex: number) {
    if (this.isExecuting) {
      // Stop current execution
      this.pauseMacroExecution();
    }
    
    // Convert steps to array if it's an object with numeric keys
    let stepsArray: Action[];
    if (Array.isArray(steps)) {
      stepsArray = steps;
    } else if (typeof steps === 'object' && steps !== null) {
      stepsArray = Object.values(steps);
    } else {
      throw new Error('Steps must be an array or object');
    }
    
    // Add START action if it doesn't exist at the beginning
    const stepsToExecute = [...stepsArray];
    let adjustedTargetIndex = targetStepIndex;
    
    if (stepsToExecute.length > 0 && stepsToExecute[0].type !== 'START') {
      const startAction: Action = {
        id: `start_${Date.now()}`,
        timestamp: Date.now(),
        type: 'START',
        details: {},
        message: 'Starting macro execution...'
      };
      stepsToExecute.unshift(startAction);
      
      // Adjust target step index to account for the added START action
      adjustedTargetIndex++;
    }
    
    // Only clear workspace if we're going to a step before the current one
    // (this is handled by the START action now)
    if (adjustedTargetIndex < this.currentStepIndex) {
      // Reset execution state completely
      this.currentStepIndex = -1;
    }
    
    // Set execution state
    this.isExecuting = true;
    this.isPaused = false;
    this.currentSteps = [...stepsToExecute];
    this.notifyPlayStateChange(true); // Notify that macro is playing

    try {
      // If we're going back, start from the beginning
      const startIndex = adjustedTargetIndex < this.currentStepIndex ? 0 : this.currentStepIndex + 1;
      
      // Execute steps up to and including the target step (not beyond)
      for (let i = startIndex; i <= adjustedTargetIndex; i++) {
        // Skip execution if we've gone beyond the available steps
        if (i >= stepsToExecute.length) break;
        
        const step = stepsToExecute[i];
        this.currentStepIndex = i;
        this.notifyMacroUpdate();
        await this.executeStep(step);
        
        // Add a small delay between steps
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error executing macro steps:', error);
    } finally {
      // Pause after reaching the target step
      this.isPaused = true;
      this.isExecuting = true; // Keep execution state active
      this.notifyPlayStateChange(false); // Update UI to show paused state
    }
  }
} 