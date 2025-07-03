import { Layout } from 'react-grid-layout';
import { GridApi } from 'ag-grid-community';

declare global {
  interface Window {
    [key: string]: any;
    gridApis: { [key: string]: GridApi };
  }
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridData {
  id: string;
  country: string;
  population: number;  // millions
  gdp: number;        // trillions $
  area: number;       // thousands km²
  [key: string]: any;
}

export interface ChartDataPoint {
  category: string;
  [key: string]: string | number;
}

export interface GridItem extends Layout {
  data?: GridData[];
  type?: 'grid' | 'pie-chart' | 'line-chart' | 'bar-chart';
  chartData?: Array<ChartDataPoint>;
  chartConfig?: {
    series?: Array<{
      field: string;
      name: string;
    }>;
  };
  sourceGridId?: string;
  selectedRange?: {
    columns: string[];
    startRow: number;
    endRow: number;
  };
}

// Use Layout type from react-grid-layout instead of our custom LayoutItem
export type { Layout }; 