import { Layout } from 'react-grid-layout';

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
}

// Use Layout type from react-grid-layout instead of our custom LayoutItem
export type { Layout }; 