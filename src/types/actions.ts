export type ActionType = 
  | 'ADD_GRID'
  | 'REMOVE_GRID'
  | 'ADD_CHART'
  | 'UPDATE_LAYOUT'
  | 'UPDATE_CELL'
  | 'SELECT_RANGE';

export interface Action {
  id: string;
  timestamp: number;
  type: ActionType;
  details: any;
}

export interface MacroStep {
  type: ActionType;
  details: any;
}

export const DEMO_MACRO: MacroStep[] = [
  {
    type: 'ADD_GRID',
    details: {
      newItem: {
        x: 0,
        y: 0,
        w: 12,
        h: 8
      }
    }
  },
  {
    type: 'SELECT_RANGE',
    details: {
      range: {
        columns: ['country', 'population', 'gdp', 'area'],
        startRow: 0,
        endRow: 9
      }
    }
  },
  {
    type: 'ADD_CHART',
    details: {
      type: 'bar-chart',
      selectedRange: {
        columns: ['country', 'population', 'gdp', 'area'],
        startRow: 0,
        endRow: 9
      },
      newItem: {
        x: 0,
        y: 8,
        w: 12,
        h: 6,
        chartConfig: {
          series: [
            { name: 'Population (M)', field: 'population' },
            { name: 'GDP (T$)', field: 'gdp' },
            { name: 'Area (K km²)', field: 'area' }
          ]
        }
      }
    }
  }
]; 