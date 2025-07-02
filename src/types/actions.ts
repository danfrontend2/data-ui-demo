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
      item: {
        i: 'grid-1',
        x: 0,
        y: 0,
        w: 12,
        h: 8,
        type: 'grid'
      }
    }
  },
  {
    type: 'SELECT_RANGE',
    details: {
      gridId: 'grid-1',
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
      sourceGridId: 'grid-1',
      selectedRange: {
        columns: ['country', 'population', 'gdp', 'area'],
        startRow: 0,
        endRow: 9
      },
      item: {
        i: 'chart-1',
        x: 0,
        y: 8,
        w: 12,
        h: 6,
        type: 'bar-chart',
        chartData: [],  // This will be filled by the handler
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