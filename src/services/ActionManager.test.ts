import ActionManager from './ActionManager';

describe('ActionManager', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = ActionManager.getInstance();
    const instance2 = ActionManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should log an action', () => {
    const actionManager = ActionManager.getInstance();
    const action = {
      type: 'ADD_GRID',
      details: {
        item: {
          i: 'test',
          x: 0,
          y: 0,
          w: 1,
          h: 1,
          type: 'grid',
          data: undefined,
        },
      },
    };
    actionManager.logAction(action.type, action.details);
    const loggedActions = actionManager.getActions();
    expect(loggedActions.length).toBe(1);
    expect(loggedActions[0].type).toBe('ADD_GRID');
  });

  it('should execute a macro', async () => {
    const actionManager = ActionManager.getInstance();
    const setItems = jest.fn();
    actionManager.setItemsHandler(setItems);

    const macro = [
      {
        type: 'ADD_GRID',
        details: {
          item: {
            i: 'test',
            x: 0,
            y: 0,
            w: 1,
            h: 1,
            type: 'grid',
            data: undefined,
          },
        },
      },
    ];

    await actionManager.executeMacro(macro);
    expect(setItems).toHaveBeenCalled();
  });
});
