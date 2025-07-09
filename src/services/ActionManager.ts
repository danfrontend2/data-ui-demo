import { Action, ActionType } from '../types/actions';
import { GridItem } from '../types';
import { Layout } from 'react-grid-layout';
import { GridApi } from 'ag-grid-community';
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
  private fieldToHeaderMapping: Map<string, string> = new Map(); // Store field -> headerName mapping
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
  private onOpenChartSettings?: (chartId?: string) => void;
  private onOpenArrangeSettings?: (columns: number) => void;
  private onCloseChartSettings?: () => void;
  private onCloseArrangeSettings?: () => void;



  private constructor() {
    console.log('Initializing ActionManager...');
    this.initializeDefaultMappings();
    this.initializeHandlers();
  }

  // Initialize default field mappings for default grid data
  private initializeDefaultMappings() {
    // Default mappings for the default grid columns
    this.fieldToHeaderMapping.set('country', 'Country');
    this.fieldToHeaderMapping.set('population', 'Population (M)');
    this.fieldToHeaderMapping.set('gdp', 'GDP (T$)');
    this.fieldToHeaderMapping.set('area', 'Area (K km²)');
    
    console.log('Initialized default field->header mappings:', Array.from(this.fieldToHeaderMapping.entries()));
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
              
              // Store mapping for future use
              this.fieldToHeaderMapping.set(safeField, header);
              
              return {
                field: safeField,
                headerName: header,
                editable: true,
                type: typeof excelData[1][headers.indexOf(header)] === 'number' ? 'numericColumn' : undefined
              };
            })
          ];
          console.log('Column definitions:', columnDefs);
          console.log('Stored field->header mapping:', Array.from(this.fieldToHeaderMapping.entries()));

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
      console.log('=== SELECT_RANGE handler called ===');
      console.log('gridId:', gridId);
      console.log('Available gridApis:', Object.keys(window.gridApis || {}));
      
      let gridApi = window.gridApis[gridId];
      console.log('gridApi found with exact ID:', !!gridApi);
      
      // Fallback: if exact gridId not found, try to find any available grid
      if (!gridApi && window.gridApis && Object.keys(window.gridApis).length > 0) {
        const availableGridId = Object.keys(window.gridApis)[0];
        gridApi = window.gridApis[availableGridId];
        console.log(`Fallback: using gridId "${availableGridId}" instead of "${gridId}"`);
      }
      
      if (gridApi) {
        console.log('Starting SELECT_RANGE processing...');
        
        // Get all rows data
        const renderedNodes = gridApi.getRenderedNodes();
        console.log('Rendered nodes:', renderedNodes);
        console.log('Rendered nodes count:', renderedNodes?.length || 0);
        
        if (!renderedNodes || !Array.isArray(renderedNodes)) {
          console.log('No rendered nodes, exiting');
          return;
        }
        
        const rowData = renderedNodes.map(node => node?.data).filter(data => data);
        console.log('Row data extracted, length:', rowData?.length || 0);
        
        if (!rowData || rowData.length === 0) {
          console.log('No row data, exiting');
          return;
        }

        // Get column definitions
        const columnDefs = gridApi.getColumnDefs() as any[];
        console.log('Column defs:', columnDefs);
        console.log('Column defs length:', columnDefs?.length || 0);
        
        if (!columnDefs || !Array.isArray(columnDefs)) {
          console.log('No column definitions, exiting');
          return;
        }
        
        const columns = columnDefs
          .filter(col => col && !col.hide && 'field' in col)
          .map(col => ({
            field: col.field as string,
            headerName: col.headerName as string
          }));
        console.log('Processed columns:', columns?.length || 0);

        // Extract selected data - support both formats
        console.log('Parameters - range:', range, 'startCell:', startCell, 'endCell:', endCell);
        
        let startRow: number, endRow: number, selectedColumns: string[];
        
        if (range) {
          console.log('Using range format');
          // New format: range object with startRow/endRow
          startRow = range.startRow;
          endRow = range.endRow;
          selectedColumns = range.columns || (columns && columns.length > 0 ? columns.map(col => col?.field).filter(field => field) : []);
          console.log('Range processing - startRow:', startRow, 'endRow:', endRow, 'columns:', selectedColumns);
        } else if (startCell && endCell && 
                   typeof startCell.rowIndex !== 'undefined' && 
                   typeof endCell.rowIndex !== 'undefined') {
          console.log('Using startCell/endCell format');
          // Old format: startCell/endCell objects with rowIndex
          startRow = Math.min(startCell.rowIndex, endCell.rowIndex);
          endRow = Math.max(startCell.rowIndex, endCell.rowIndex);
          selectedColumns = columns && columns.length > 0 ? columns.map(col => col?.field).filter(field => field) : [];
          console.log('StartCell/EndCell processing - startRow:', startRow, 'endRow:', endRow, 'columns:', selectedColumns);
        } else {
          console.error('Invalid SELECT_RANGE format: missing range or startCell/endCell');
          console.log('Received data - range:', range, 'startCell:', startCell, 'endCell:', endCell);
          return;
        }
        
        if (!selectedColumns || selectedColumns.length === 0) {
          console.log('No selected columns, exiting');
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

        // Flash the selected cells to highlight the selection
        try {
          console.log('=== STARTING FLASH CELLS ===');
          console.log('Flash cells - startRow:', startRow, 'endRow:', endRow, 'selectedColumns:', selectedColumns);
          
          // Get all row nodes first
          const allRowNodes = gridApi.getRenderedNodes();
          console.log('Total rendered nodes:', allRowNodes?.length || 0);
          
          if (!allRowNodes || !Array.isArray(allRowNodes)) {
            console.warn('FLASH ABORTED: No row nodes for flash');
          } else {
            console.log('Row nodes available, proceeding with flash...');
            
            // Select the right row nodes
            const rowNodes: any[] = [];
            for (let i = startRow; i <= endRow; i++) {
              if (allRowNodes[i]) {
                rowNodes.push(allRowNodes[i]);
              }
            }
            
            console.log('Selected row nodes:', rowNodes?.length || 0);
            
            // Get column objects
            const columnObjects = selectedColumns && Array.isArray(selectedColumns) ? selectedColumns
              .map(colField => {
                if (!colField || typeof colField !== 'string') return null;
                const col = gridApi.getColumn(colField);
                console.log('Column field:', colField, 'found column:', !!col);
                return col;
              })
              .filter((col): col is NonNullable<typeof col> => col !== null) : [];

            console.log('Column objects found:', columnObjects?.length || 0);

            if (rowNodes && rowNodes.length > 0 && columnObjects && columnObjects.length > 0) {
              console.log('✅ Calling flashCells with:', { rowNodes: rowNodes.length, columns: columnObjects.length });
              
              // Add a small delay to ensure the grid is ready
              setTimeout(() => {
                gridApi.flashCells({
                  rowNodes: rowNodes,
                  columns: columnObjects,
                  flashDuration: 1000,  // Longer flash for visibility
                  fadeDuration: 800    // Longer fade for visibility
                });
                console.log('✅ flashCells called successfully');
              }, 100);
            } else {
              console.warn('❌ FLASH SKIPPED: No rows or columns to flash:', { 
                rowNodes: rowNodes?.length || 0, 
                columns: columnObjects?.length || 0 
              });
            }
          }
        } catch (error) {
          console.error('❌ FLASH ERROR:', error);
        }
      } else {
        console.error('gridApi not found for gridId:', gridId);
        console.log('Available gridApis:', window.gridApis);
      }
    });

    this.registerHandler('ADD_CHART', ({ item }) => {
      if (!this.setItems) return;
      
      // Fix series names to use original headers instead of normalized field names
      if (item.chartConfig?.series) {
        item.chartConfig.series = item.chartConfig.series.map((series: any) => {
          const originalName = this.denormalizeFieldName(series.field);
          console.log(`Converting series name: "${series.field}" -> "${originalName}"`);
          return {
            ...series,
            name: originalName
          };
        });
      }
      
      const newItems = [...this.items];
      const existingIndex = newItems.findIndex(i => i.i === item.i);
      if (existingIndex >= 0) {
        newItems[existingIndex] = item;
      } else {
        newItems.push(item);
      }
      this.setItems(newItems);
    });

    this.registerHandler('ARRANGE', async ({ columns }: { columns: number }) => {
      // Open arrange settings to show the change
      if (this.onOpenArrangeSettings) {
        this.onOpenArrangeSettings(columns);
        // Wait a bit to show the panel opening and slider animation
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

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
      
      // Additional pause to show the visual change
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Close arrange settings panel
      if (this.onCloseArrangeSettings) {
        this.onCloseArrangeSettings();
      }
    });

    this.registerHandler('UPDATE_CHART_OPACITY', async ({ opacity, chartId }) => {
      // Open chart settings to show the change
      if (this.onOpenChartSettings) {
        this.onOpenChartSettings(chartId);
        // Wait a bit to show the panel opening
        await new Promise(resolve => setTimeout(resolve, 500));
      }

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
      
      // Additional pause to show the visual change
      await new Promise(resolve => setTimeout(resolve, 800));
    });

    this.registerHandler('UPDATE_CHART_STROKE_WIDTH', async ({ strokeWidth, chartId }) => {
      // Open chart settings to show the change
      if (this.onOpenChartSettings) {
        this.onOpenChartSettings(chartId);
        // Wait a bit to show the panel opening
        await new Promise(resolve => setTimeout(resolve, 500));
      }

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
      
      // Additional pause to show the visual change
      await new Promise(resolve => setTimeout(resolve, 800));
    });

    this.registerHandler('UPDATE_CHART_COLOR_SET', async ({ colorSet, chartId }) => {
      // Open chart settings to show the change
      if (this.onOpenChartSettings) {
        this.onOpenChartSettings(chartId);
        // Wait a bit to show the panel opening
        await new Promise(resolve => setTimeout(resolve, 500));
      }

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
      
      // Additional pause to show the visual change
      await new Promise(resolve => setTimeout(resolve, 800));
    });

    this.registerHandler('UPDATE_CHART_SHOW_LEGEND', async ({ showLegend, chartId }) => {
      // Open chart settings to show the change
      if (this.onOpenChartSettings) {
        this.onOpenChartSettings(chartId);
        // Wait a bit to show the panel opening
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!this.setItems || !this.items) return;
      
      const newItems = this.items.map(item => {
        if ((item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') && 
            (!chartId || item.i === chartId)) {
          return {
            ...item,
            chartConfig: {
              ...item.chartConfig,
              showLegend
            }
          };
        }
        return item;
      });
      
      this.setItems(newItems);
      
      // Additional pause to show the visual change
      await new Promise(resolve => setTimeout(resolve, 800));
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

  setChartSettingsHandler(handler: (chartId?: string) => void) {
    this.onOpenChartSettings = handler;
  }

  setArrangeSettingsHandler(handler: (columns: number) => void) {
    this.onOpenArrangeSettings = handler;
  }

  setCloseChartSettingsHandler(handler: () => void) {
    this.onCloseChartSettings = handler;
  }

  setCloseArrangeSettingsHandler(handler: () => void) {
    this.onCloseArrangeSettings = handler;
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
      
      // Close all settings panels at the end of macro
      if (this.onCloseChartSettings) {
        this.onCloseChartSettings();
      }
      if (this.onCloseArrangeSettings) {
        this.onCloseArrangeSettings();
      }
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
        
        // Close all settings panels at the end of macro
        if (this.onCloseChartSettings) {
          this.onCloseChartSettings();
        }
        if (this.onCloseArrangeSettings) {
          this.onCloseArrangeSettings();
        }
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
    if (this.isPaused) {
      if (this.executionResolve) {
        // Resume normal execution flow
        this.isPaused = false;
        this.notifyPlayStateChange(true);
        this.executionResolve();
      } else if (this.currentSteps.length > 0) {
        // Continue execution from current step when paused via executeUpToStep
        this.continueExecutionFromCurrentStep();
      }
    }
  }

  private async continueExecutionFromCurrentStep() {
    if (!this.isPaused || !this.currentSteps.length) {
      return;
    }

    this.isPaused = false;
    this.notifyPlayStateChange(true);

    try {
      // Continue from the next step after current
      for (let i = this.currentStepIndex + 1; i < this.currentSteps.length; i++) {
        // Check if we were paused again
        if (this.isPaused) {
          // Create a promise that will be resolved when resuming
          this.executionPromise = new Promise((resolve) => {
            this.executionResolve = resolve;
          });
          await this.executionPromise;
          this.executionPromise = null;
          this.executionResolve = null;
        }

        const step = this.currentSteps[i];
        this.currentStepIndex = i;
        this.notifyMacroUpdate();
        await this.executeStep(step);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between steps
      }
    } catch (error) {
      console.error('Error continuing macro execution:', error);
    } finally {
      this.isExecuting = false;
      this.isPaused = false;
      this.executionPromise = null;
      this.executionResolve = null;
      this.notifyPlayStateChange(false);
      
      // Close all settings panels at the end of macro
      if (this.onCloseChartSettings) {
        this.onCloseChartSettings();
      }
      if (this.onCloseArrangeSettings) {
        this.onCloseArrangeSettings();
      }
    }
  }

  // Utility function to normalize field names
  private normalizeFieldName(field: string): string {
    return field.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_');
  }

  // Utility function to restore original field names from normalized ones
  private denormalizeFieldName(normalizedField: string): string {
    // First try to find exact match in stored mapping
    const exactMatch = this.fieldToHeaderMapping.get(normalizedField);
    if (exactMatch) {
      console.log(`Found exact mapping: "${normalizedField}" -> "${exactMatch}"`);
      return exactMatch;
    }
    
    // Fallback: try to find partial matches (useful for cases like "population" -> "Population (M)")
    for (const [field, header] of Array.from(this.fieldToHeaderMapping.entries())) {
      // Check if the normalized field is a simplified version of a stored field
      const simplifiedStoredField = field.toLowerCase().replace(/_+/g, '');
      const simplifiedInputField = normalizedField.toLowerCase().replace(/_+/g, '');
      
      if (simplifiedStoredField.includes(simplifiedInputField) || 
          simplifiedInputField.includes(simplifiedStoredField)) {
        console.log(`Found partial mapping: "${normalizedField}" -> "${header}" (via "${field}")`);
        return header;
      }
    }
    
    console.log(`No mapping found for "${normalizedField}", returning as-is`);
    return normalizedField; // Return as-is if no mapping found
  }

  setMessageHandler(handler: MessageCallback) {
    this.onMessage = handler;
  }

  private async executeStep(step: Action) {
    console.log('Executing step:', step);
    console.log('Step type:', step.type);
    console.log('Step details:', step.details);
    console.log('Available handlers:', Object.keys(this.actionHandlers));
    
    // Always use generated message for consistency
    if (this.onMessage) {
      this.onMessage(getActionMessage(step));
    }
    
    const handler = this.actionHandlers[step.type];
    if (handler) {
      console.log('Handler found for action:', step.type);
      await handler(step.details);
    } else {
      console.warn('No handler found for action:', step.type);
      console.warn('Step with missing handler:', JSON.stringify(step, null, 2));
    }

    // Auto-scroll to bottom after each action
    this.scrollWorkspaceToBottom();
  }

  private scrollWorkspaceToBottom() {
    try {
      // Wait a bit for the layout to settle after adding new items
      setTimeout(() => {
        console.log('Auto-scrolling to workspace bottom...');
        
        // Simple approach: just scroll to the very bottom of the page
        const documentHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        
        console.log('Document height:', documentHeight, 'Window height:', window.innerHeight);
        
        // Scroll to bottom with extra padding
        window.scrollTo({ 
          top: documentHeight + 200, // Extra padding to ensure everything is visible
          behavior: 'smooth' 
        });
        
        console.log('Scrolled window to bottom:', documentHeight + 200);
      }, 300); // Wait 300ms for layout to settle
    } catch (error) {
      console.warn('Could not auto-scroll workspace:', error);
    }
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