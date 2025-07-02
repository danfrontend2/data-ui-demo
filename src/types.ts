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
}

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Use Layout type from react-grid-layout instead of our custom LayoutItem
export type { Layout }; 