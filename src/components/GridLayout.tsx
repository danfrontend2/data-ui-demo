import React, { useState, useEffect, useMemo } from 'react';
import RGL, { WidthProvider, Layout } from 'react-grid-layout';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GridApi,
  GridOptions,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  GetContextMenuItemsParams,
  MenuItemDef,
  RangeSelectionChangedEvent,
  GetContextMenuItems
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { GridData } from '../types';
import PieChart from './PieChart';
import * as XLSX from 'xlsx';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const ReactGridLayout = WidthProvider(RGL);

interface GridItem extends Layout {
  data?: GridData[];
  type?: 'grid' | 'chart';
  chartData?: Array<{ category: string; value: number; }>;
}

interface GridLayoutProps {
  items: GridItem[];
  onRemoveItem: (itemId: string) => void;
  onAddChart: (chartItem: GridItem) => void;
}

const GridLayout: React.FC<GridLayoutProps> = ({ items, onRemoveItem, onAddChart }) => {
  // Sample data for initial grid state
  const defaultData = useMemo(() => [
    { id: '1', country: 'China', population: 1412, gdp: 17.7, area: 9597 },
    { id: '2', country: 'India', population: 1400, gdp: 3.7, area: 3287 },
    { id: '3', country: 'USA', population: 339, gdp: 28.8, area: 9834 },
    { id: '4', country: 'Indonesia', population: 278, gdp: 1.5, area: 1905 },
    { id: '5', country: 'Pakistan', population: 241, gdp: 0.4, area: 881 },
    { id: '6', country: 'Nigeria', population: 223, gdp: 0.5, area: 924 },
    { id: '7', country: 'Brazil', population: 216, gdp: 2.2, area: 8516 },
    { id: '8', country: 'Bangladesh', population: 172, gdp: 0.5, area: 148 },
    { id: '9', country: 'Russia', population: 144, gdp: 2.0, area: 17098 },
    { id: '10', country: 'Mexico', population: 129, gdp: 1.8, area: 1964 }
  ], []);

  const [gridData, setGridData] = useState<{ [key: string]: GridData[] }>({});
  const [columnDefs, setColumnDefs] = useState<{ [key: string]: ColDef[] }>({});

  // Initialize data for new grids
  useEffect(() => {
    const newGridData = { ...gridData };
    let hasNewData = false;

    items.forEach(item => {
      if (!newGridData[item.i]) {
        newGridData[item.i] = item.data || [...defaultData];
        hasNewData = true;
      }
    });

    if (hasNewData) {
      setGridData(newGridData);
    }
  }, [items, gridData, defaultData]);

  const onCellValueChanged = (params: CellValueChangedEvent) => {
    console.log('Cell changed:', {
      rowIndex: params.rowIndex,
      data: params.data,
      newValue: params.newValue,
      oldValue: params.oldValue,
      field: params.colDef.field
    });

    if (!params.colDef.field) return;

    const newValue = params.colDef.type === 'numericColumn' 
      ? parseFloat(params.newValue) 
      : params.newValue;

    const gridId = params.api.getGridId();
    console.log('Grid ID:', gridId);
    
    if (!gridId) return;

    const rowId = params.data.id;
    const field = params.colDef.field;

    setGridData(prev => {
      const currentData = [...(prev[gridId] || defaultData)];
      const rowIndex = currentData.findIndex(row => row.id === rowId);
      
      if (rowIndex >= 0) {
        const updatedData = currentData.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...row,
              [field]: newValue
            } as GridData;
          }
          return row;
        });
        
        console.log('Updated data:', updatedData);
        return { ...prev, [gridId]: updatedData };
      }
      
      return prev;
    });
  };

  // Default columns
  const defaultColumns: ColDef[] = [
    { field: 'country', headerName: 'Country', editable: true },
    { field: 'population', headerName: 'Population (M)', editable: true, type: 'numericColumn' },
    { field: 'gdp', headerName: 'GDP (T$)', editable: true, type: 'numericColumn' },
    { field: 'area', headerName: 'Area (K km²)', editable: true, type: 'numericColumn' }
  ];

  const handleRemoveItem = (e: React.MouseEvent, itemId: string) => {
    console.log('Click on close button');
    e.preventDefault();
    e.stopPropagation();
    onRemoveItem(itemId);
  };

  const processFile = async (file: File, gridId: string) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        blankrows: false,
        defval: '',
        rawNumbers: true
      });

      if (jsonData.length > 0) {
        const keyMapping = Array.from(
          new Set(
            jsonData.reduce((keys: string[], row: any) => {
              return keys.concat(Object.keys(row));
            }, [])
          )
        ).reduce((acc: { [key: string]: string }, key: string) => {
          const safeKey = key.replace(/\./g, '_');
          acc[key] = safeKey;
          return acc;
        }, {});

        // Function to convert string or number with thousand separators to number
        const parseNumberWithSeparators = (value: string | number): number | string => {
          if (typeof value === 'number') return value;
          if (typeof value !== 'string') return value;
           
          const cleanValue = value.trim().replace(/["']/g, '');
          if (!cleanValue) return '';
          
          const numericValue = cleanValue.replace(/,/g, '');
          const parsed = parseFloat(numericValue);
          return isNaN(parsed) ? value : parsed;
        };

        // Create columns based on all found keys
        const columns = [
          { field: 'id', hide: true },
          ...Object.entries(keyMapping).map(([originalKey, safeKey]) => {
            const hasNumericValue = jsonData.some(row => {
              const value = (row as any)[originalKey];
              const parsedValue = parseNumberWithSeparators(value);
              return typeof parsedValue === 'number';
            });

            return {
              field: safeKey,
              headerName: originalKey,
              sortable: true,
              filter: true,
              editable: true,
              type: hasNumericValue ? 'numericColumn' : undefined,
              valueFormatter: hasNumericValue ? (params: any) => {
                const value = parseNumberWithSeparators(params.value);
                return value.toString();
              } : undefined
            };
          })
        ];

        // Normalize data using safe keys and add unique ids
        const formattedData: GridData[] = jsonData.map((row: any, index: number) => {
          const newRow: Record<string, any> = { id: (index + 1).toString() };
          Object.entries(keyMapping).forEach(([originalKey, safeKey]) => {
            const value = row[originalKey];
            newRow[safeKey] = parseNumberWithSeparators(value);
          });
          return newRow as GridData;
        });

        console.log('Formatted data:', formattedData);
        console.log('Columns:', columns);

        setColumnDefs(prev => ({ ...prev, [gridId]: columns }));
        setGridData(prev => ({ ...prev, [gridId]: formattedData }));
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, gridId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.csv')) {
        processFile(file, gridId);
      }
    }
  };

  const getContextMenuItems: GetContextMenuItems = (params: GetContextMenuItemsParams) => {
    const result: MenuItemDef[] = [
      {
        name: 'Draw Chart',
        action: () => {
          const cellRanges = params.api.getCellRanges();
          if (!cellRanges || cellRanges.length === 0) {
            console.log('No range selected');
            return;
          }

          const range = cellRanges[0];
          const startRow = range.startRow?.rowIndex ?? 0;
          const endRow = range.endRow?.rowIndex ?? 0;
          const columns = range.columns;

          if (columns.length !== 2) {
            console.log('Please select exactly 2 columns: one for categories and one for values');
            return;
          }

          // Get selected data
          const chartData: Array<{ category: string; value: number }> = [];
          params.api.forEachNodeAfterFilterAndSort((node) => {
            const rowIndex = node.rowIndex;
            if (rowIndex !== null && rowIndex !== undefined && 
                rowIndex >= startRow && 
                rowIndex <= endRow) {
              const category = node.data[columns[0].getColId()];
              const value = parseFloat(node.data[columns[1].getColId()]);
              if (!isNaN(value)) {
                chartData.push({ category: String(category), value });
              }
            }
          });

          // Create new chart item
          const newItem: GridItem = {
            i: `chart-${Date.now()}`,
            x: (items.length * 2) % 12,
            y: Math.floor(items.length / 6) * 4,
            w: 6,
            h: 4,
            type: 'chart',
            chartData
          };

          // Add new item to layout using the provided callback
          onAddChart(newItem);
        }
      }
    ];

    return [...result, 'separator', ...(params.defaultItems || [])];
  };

  const renderGrid = (item: GridItem) => {
    if (item.type === 'chart') {
      return (
        <Box
          key={item.i}
          data-grid={item}
          sx={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box 
            className="drag-handle"
            sx={{ 
              height: '20px', 
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #ddd',
              cursor: 'move'
            }} 
          />
          <IconButton
            onClick={(e) => handleRemoveItem(e, item.i)}
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          <PieChart data={item.chartData || []} />
        </Box>
      );
    }

    const gridOptions: GridOptions = {
      rowData: gridData[item.i] || defaultData,
      columnDefs: columnDefs[item.i] || defaultColumns,
      enableRangeSelection: true,
      enableFillHandle: true,
      suppressRowClickSelection: true,
      getContextMenuItems: getContextMenuItems,
      onCellValueChanged: onCellValueChanged
    };

    return (
      <Box
        key={item.i}
        data-grid={item}
        sx={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box 
          className="drag-handle"
          sx={{ 
            height: '20px', 
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            cursor: 'move'
          }} 
        />
        <IconButton
          onClick={(e) => handleRemoveItem(e, item.i)}
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          className="ag-theme-balham"
          sx={{
            height: 'calc(100% - 20px)',
            width: '100%'
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.i)}
        >
          <AgGridReact {...gridOptions} />
        </Box>
      </Box>
    );
  };

  return (
    <ReactGridLayout
      className="layout"
      cols={12}
      rowHeight={30}
      draggableHandle=".drag-handle"
      onLayoutChange={(newLayout) => {
        console.log('Layout changed:', newLayout);
      }}
    >
      {items.map((item) => renderGrid(item))}
    </ReactGridLayout>
  );
};

export default GridLayout; 