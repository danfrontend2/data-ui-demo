import { Action, MacroStep } from '../types/actions';

export default class ActionManager {
  private static instance: ActionManager;
  private actions: Action[] = [];
  private actionHandlers: { [key: string]: (details: any) => void } = {};
  private isRecording: boolean = false;
  private recordedActions: any[] = [];

  private constructor() {}

  static getInstance(): ActionManager {
    if (!ActionManager.instance) {
      ActionManager.instance = new ActionManager();
    }
    return ActionManager.instance;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  registerHandler(type: Action['type'], handler: (details: any) => void) {
    this.actionHandlers[type] = handler;
  }

  logAction(type: Action['type'], details: any) {
    const action: Action = {
      id: new Date().getTime().toString(),
      timestamp: new Date().getTime(),
      type,
      details
    };
    
    this.actions.push(action);
    console.log('Action logged:', action);
    
    // If recording, store the action
    if (this.isRecording) {
      this.recordedActions.push({
        type,
        details
      });
    }

    // Execute the action
    if (this.actionHandlers[type]) {
      this.actionHandlers[type](details);
    }
  }

  startRecording() {
    this.isRecording = true;
    this.recordedActions = [];
    console.log('Started recording macro');
  }

  stopRecording() {
    this.isRecording = false;
    console.log('Stopped recording macro:', this.recordedActions);
    const macro = [...this.recordedActions];
    this.recordedActions = [];
    return macro;
  }

  private generateUniqueId(prefix: string): string {
    return `${prefix}-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async executeMacro(steps: MacroStep[]) {
    let lastGridId: string | null = null;

    for (const step of steps) {
      // Deep clone the step details to avoid modifying the original macro
      const details = JSON.parse(JSON.stringify(step.details));

      // For ADD_GRID, create a new grid item like handleAddItem does
      if (step.type === 'ADD_GRID' && details.newItem) {
        const gridItem = {
          ...details.newItem,
          i: `containergrid_${Date.now()}`,
          type: 'grid'
        };
        lastGridId = gridItem.i;
        await this.actionHandlers[step.type]({ item: gridItem });
      }
      // For SELECT_RANGE, use the last created grid ID
      else if (step.type === 'SELECT_RANGE' && lastGridId) {
        const selectDetails = {
          ...details,
          gridId: lastGridId
        };
        await this.actionHandlers[step.type](selectDetails);
      }
      // For ADD_CHART, create a new chart item and use the last grid as source
      else if (step.type === 'ADD_CHART' && details.newItem) {
        const chartItem = {
          ...details.newItem,
          i: `${details.type}-${Date.now()}`,
          type: details.type,
          chartData: []
        };
        const chartDetails = {
          item: chartItem,
          sourceGridId: lastGridId,
          selectedRange: details.selectedRange
        };
        await this.actionHandlers[step.type](chartDetails);
      }

      // Add delay after each step
      await this.delay(1000);
    }
  }

  getActions(): Action[] {
    return [...this.actions];
  }
} 