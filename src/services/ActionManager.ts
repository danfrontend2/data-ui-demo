import { Action, MacroStep } from '../types/actions';

class ActionManager {
  private static instance: ActionManager;
  private actions: Action[] = [];
  private actionHandlers: { [key: string]: (details: any) => void } = {};

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
  }

  async executeMacro(steps: MacroStep[]) {
    for (const step of steps) {
      const handler = this.actionHandlers[step.type];
      if (handler) {
        await handler(step.details);
        this.logAction(step.type, step.details);
        // Add 1 second delay after each step
        await this.delay(1000);
      } else {
        console.warn(`No handler registered for action type: ${step.type}`);
      }
    }
  }

  getActions(): Action[] {
    return [...this.actions];
  }
}

export default ActionManager; 