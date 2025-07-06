import { Layout } from 'react-grid-layout';
import { GridItem } from '../types';

export type ActionType = 
  | 'ADD_GRID'
  | 'REMOVE_GRID'
  | 'REMOVE_ALL_GRIDS'
  | 'UPDATE_LAYOUT'
  | 'UPDATE_CELL'
  | 'DROP_FILE'
  | 'SELECT_RANGE'
  | 'ADD_CHART'
  | 'ARRANGE'
  | 'UPDATE_CHART_OPACITY'
  | 'UPDATE_CHART_STROKE_WIDTH'
  | 'UPDATE_CHART_COLOR_SET';

export interface Action {
  id: string;
  timestamp: number;
  type: ActionType;
  details: any;
  message?: string;
}

export interface AddGridAction extends Action {
  type: 'ADD_GRID';
  details: {
    item: GridItem;
  };
}

export interface RemoveGridAction extends Action {
  type: 'REMOVE_GRID';
  details: {
    itemId: string;
  };
}

export interface UpdateLayoutAction extends Action {
  type: 'UPDATE_LAYOUT';
  details: {
    layout: Layout[];
  };
}

export interface AddChartAction extends Action {
  type: 'ADD_CHART';
  details: {
    item: GridItem;
    sourceGridId?: string;
    selectedRange?: {
      columns: string[];
      startRow: number;
      endRow: number;
    };
  };
}

export interface SelectRangeAction extends Action {
  type: 'SELECT_RANGE';
  details: {
    gridId: string;
    range: {
      columns: string[];
      startRow: number;
      endRow: number;
    };
  };
}

export interface DropFileAction extends Action {
  type: 'DROP_FILE';
  details: {
    gridId: string;
    excelData: any[][];
    fileType?: string;
  };
}

export interface UpdateCellAction extends Action {
  type: 'UPDATE_CELL';
  details: {
    gridId: string;
    rowId: string;
    field: string;
    oldValue: any;
    newValue: any;
  };
}

export interface MacroStep {
  type: ActionType;
  details: any;
}

export interface ArrangeDetails {
  columns: number;
}

export const DEMO_MACRO: Action[] = [
  {
    id: '1',
    timestamp: Date.now(),
    type: 'ADD_GRID',
    details: {
      item: {
        i: 'grid_demo1',
        x: 0,
        y: 0,
        w: 12,
        h: 12,
        type: 'grid'
      }
    }
  },
  {
    id: '2',
    timestamp: Date.now(),
    type: 'DROP_FILE',
    details: {
      gridId: 'grid_demo1',
      excelData: [
        ['Страна', 'Население (млн)', 'ВВП (трлн $)', 'Площадь (тыс. км²)'],
        ['Китай', 1412, 17.7, 9597],
        ['Индия', 1400, 3.7, 3287],
        ['США', 339, 28.8, 9834],
        ['Индонезия', 278, 1.5, 1905],
        ['Пакистан', 241, 0.4, 881],
        ['Нигерия', 223, 0.5, 924],
        ['Бразилия', 216, 2.2, 8516],
        ['Бангладеш', 172, 0.5, 148],
        ['Россия', 144, 2.0, 17098],
        ['Мексика', 129, 1.8, 1964]
      ]
    }
  }
]; 