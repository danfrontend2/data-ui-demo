import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WidthProvider, Responsive, Layout } from 'react-grid-layout';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  GetContextMenuItemsParams,
  MenuItemDef,
  GridApi,
  GridReadyEvent
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { GridData, GridItem, ChartDataPoint } from '../types';
import PieChart from './PieChart';
import LineChart from './LineChart';
import BarChart from './BarChart';
import * as XLSX from 'xlsx';
import ActionManager from '../services/ActionManager';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridLayoutProps {
  items: GridItem[];
  onRemoveItem: (itemId: string) => void;
  onAddChart: (item: GridItem) => void;
  onLayoutChange: (layout: Layout[]) => void;
  onArrangeItems?: (columns: number) => void;
}

declare global {
  interface Window {
    gridApis: {
      [key: string]: GridApi;
    };
  }
}

const defaultColumns: ColDef[] = [
  { field: 'country', headerName: 'Country', editable: true },
  { field: 'population', headerName: 'Population (M)', editable: true, type: 'numericColumn' },
  { field: 'gdp', headerName: 'GDP (T$)', editable: true, type: 'numericColumn' },
  { field: 'area', headerName: 'Area (K km²)', editable: true, type: 'numericColumn' }
];

const defaultData: GridData[] = [
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
];

const GridLayout: React.FC<GridLayoutProps> = ({
  items: initialItems,
  onRemoveItem,
  onAddChart,
  onLayoutChange,
  onArrangeItems
}) => {
  const [localItems, setLocalItems] = useState<GridItem[]>(initialItems);
  const [selectedData, setSelectedData] = useState<any[] | null>(null);
  const [chartAnchorEl, setChartAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [gridData, setGridData] = useState<{ [key: string]: GridData[] }>({});
  const [columnDefs, setColumnDefs] = useState<{ [key: string]: ColDef[] }>({});
  const [columns, setColumns] = useState<number>(2);
  const [showArrangeControls, setShowArrangeControls] = useState<boolean>(false);
  const onArrangeItemsRef = useRef(onArrangeItems);

  // Update ref when prop changes
  useEffect(() => {
    onArrangeItemsRef.current = onArrangeItems;
  }, [onArrangeItems]);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(initialItems);
  }, [initialItems]);

  // Initialize data for new grids
  useEffect(() => {
    const newGridData = { ...gridData };
    const newColumnDefs = { ...columnDefs };
    let hasNewData = false;

    localItems.forEach(item => {
      if (item.type === 'grid' && !newGridData[item.i]) {
        newGridData[item.i] = item.data || [...defaultData];
        newColumnDefs[item.i] = defaultColumns;
        hasNewData = true;
      }
    });

    if (hasNewData) {
      setGridData(newGridData);
      setColumnDefs(newColumnDefs);
    }
  }, [localItems, gridData, columnDefs]);

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

        // Log cell update action
        ActionManager.getInstance().logAction('UPDATE_CELL', {
          gridId,
          rowId,
          field,
          oldValue: params.oldValue,
          newValue: params.newValue
        });

        return { ...prev, [gridId]: updatedData };
      }
      
      return prev;
    });
  };

  const handleRemoveItem = (e: React.MouseEvent, itemId: string) => {
    console.log('Click on close button');
    e.preventDefault();
    e.stopPropagation();
    onRemoveItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    console.log('Dropped files:', files);
    console.log('Files length:', files.length);
    
    if (files.length) {
      const file = files[0];
      console.log('File type:', file.type);
      console.log('File name:', file.name);
      
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'text/csv' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.csv')) {
        console.log('Processing file...');
        processFile(file, localItems[0].i);
      } else {
        console.warn('Unsupported file type:', file.type);
      }
    }
  };

  const processFile = async (file: File, gridId: string) => {
    console.log('Starting file processing for grid:', gridId);
    try {
      console.log('Reading file as ArrayBuffer...');
      const data = await file.arrayBuffer();
      console.log('Creating XLSX workbook...');
      const workbook = XLSX.read(data);
      console.log('Available sheets:', workbook.SheetNames);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get the raw Excel data in array format
      const excelData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array format instead of objects
        raw: true, // Keep raw values
        defval: null
      });

      console.log('Excel data raw:', excelData);
      console.log('First row (headers):', excelData[0]);
      console.log('Second row (first data row):', excelData[1]);

      // Log the DROP_FILE action with Excel data
      ActionManager.getInstance().logAction('DROP_FILE', {
        gridId,
        excelData,
        fileType: file.type
      });

      console.log('Action logged with data:', {
        gridId,
        excelData,
        fileType: file.type
      });
    } catch (error) {
      console.error('Failed to process file:', error);
    }
  };

  const handleRangeSelection = (params: GetContextMenuItemsParams) => {
    const gridId = params.api.getGridId();
    if (!gridId) return;

    const cellRanges = params.api.getCellRanges();
    if (!cellRanges || cellRanges.length === 0) return;

    const range = cellRanges[0];
    const startRow = range.startRow?.rowIndex ?? 0;
    const endRow = range.endRow?.rowIndex ?? 0;
    const columns = range.columns.map(col => col.getColId());

    ActionManager.getInstance().logAction('SELECT_RANGE', {
      gridId,
      range: {
        columns,
        startRow,
        endRow
      }
    });

    return {
      gridId,
      range: {
        columns,
        startRow,
        endRow
      }
    };
  };

  const createChartItem = (type: 'pie-chart' | 'line-chart' | 'bar-chart', params: GetContextMenuItemsParams) => {
    const selection = handleRangeSelection(params);
    if (!selection) {
      console.log('No range selected');
      return;
    }

    const { gridId, range } = selection;
    const { columns, startRow, endRow } = range;

    if (columns.length < 2) {
      console.log('Please select at least 2 columns: first for categories, others for values');
      return;
    }

    // Get selected data
    const chartData: Array<ChartDataPoint> = [];
    const xField = columns[0];
    
    params.api.forEachNodeAfterFilterAndSort((node) => {
      const rowIndex = node.rowIndex;
      if (rowIndex !== null && rowIndex !== undefined && 
          rowIndex >= startRow && 
          rowIndex <= endRow) {
        const point: ChartDataPoint = {
          category: String(node.data[xField])
        };
        
        // Add values for each Y-axis column
        columns.slice(1).forEach(field => {
          const value = parseFloat(node.data[field]);
          if (!isNaN(value)) {
            point[field] = value;
          }
        });
        
        chartData.push(point);
      }
    });

    // Find the maximum Y coordinate among existing items
    const maxY = localItems.reduce((max, item) => {
      const itemBottom = item.y + item.h;
      return itemBottom > max ? itemBottom : max;
    }, 0);

    // Get the source grid's height
    const sourceGridItem = localItems.find(item => item.i === gridId);
    const sourceHeight = sourceGridItem?.h || 4;

    // Create new chart item
    const chartItem: GridItem = {
      i: `${type}-${Date.now()}`,
      x: 0,
      y: maxY,
      w: 6,
      h: sourceHeight * 2,
      type,
      chartData,
      chartConfig: {
        series: columns.slice(1).map(field => ({
          field,
          name: field
        }))
      }
    };

    onAddChart({
      ...chartItem,
      sourceGridId: gridId,
      selectedRange: range
    });
  };

  const getContextMenuItems = (params: GetContextMenuItemsParams): MenuItemDef[] => {
    const result: MenuItemDef[] = [
      {
        name: "Draw Pie Chart",
        icon: '<span class="custom-menu-icon"><svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M11,2V22C5.9,21.5 2,17.2 2,12C2,6.8 5.9,2.5 11,2M13,2V11H22C21.5,6.2 17.8,2.5 13,2M13,13V22C17.7,21.5 21.5,17.8 22,13H13Z" fill="currentColor"></path></svg></span>',
        action: () => createChartItem('pie-chart', params)
      },
      {
        name: "Draw Line Chart",
        icon: '<span class="custom-menu-icon"><svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z" fill="currentColor"></path></svg></span>',
        action: () => createChartItem('line-chart', params)
      },
      {
        name: "Draw Bar Chart",
        icon: '<span class="custom-menu-icon"><svg viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z" fill="currentColor"></path></svg></span>',
        action: () => createChartItem('bar-chart', params)
      }
    ];
    return result;
  };

  // Add styles for menu icons and grid layout
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-menu-icon {
        display: inline-flex;
        align-items: center;
        margin-right: 8px;
        color: #666;
      }
      .ag-menu-option-active .custom-menu-icon {
        color: #2196f3;
      }
      .react-grid-item {
        transition: all 200ms ease;
        transition-property: left, top, width, height;
      }
      .react-grid-item.resizing {
        z-index: 1;
        will-change: width, height;
      }
      .react-grid-item.react-draggable-dragging {
        transition: none;
        z-index: 3;
        will-change: transform;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        cursor: move !important;
      }
      .react-grid-item.react-grid-placeholder {
        background: rgba(33, 150, 243, 0.1);
        border: 1px dashed #2196f3;
        transition: all 100ms linear;
        z-index: 2;
        border-radius: 4px;
        user-select: none;
      }
      .react-grid-item > .react-resizable-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        bottom: 0;
        right: 0;
        cursor: se-resize;
      }
      .react-grid-item > .react-resizable-handle::after {
        content: "";
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 5px;
        height: 5px;
        border-right: 2px solid rgba(0, 0, 0, 0.4);
        border-bottom: 2px solid rgba(0, 0, 0, 0.4);
      }
      .drag-handle {
        touch-action: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // Initialize gridApis object if it doesn't exist
    if (!window.gridApis) {
      window.gridApis = {};
    }
  }, []);

  // Move gridOptions to the component level
  const baseGridOptions = useMemo(() => ({
    enableRangeSelection: true,
    rowSelection: 'multiple' as const, // Fix type error
    suppressRowClickSelection: true,
    suppressCellSelection: false,
    suppressContextMenu: false,
    defaultColDef: {
      editable: true,
      resizable: true,
      sortable: true,
      filter: true
    }
  }), []);

  const renderGrid = (item: GridItem) => {
    if (item.type === 'pie-chart') {
      return renderChart(item, PieChart, 'Pie Chart');
    } else if (item.type === 'line-chart') {
      return renderChart(item, LineChart, 'Line Chart');
    } else if (item.type === 'bar-chart') {
      return renderChart(item, BarChart, 'Bar Chart');
    }

    // Get grid number from existing grids
    const gridNumber = localItems
      .filter(i => i.type === 'grid')
      .findIndex(i => i.i === item.i) + 1;

    // Combine base options with item-specific options
    const gridOptions = {
      ...baseGridOptions,
      columnDefs: columnDefs[item.i] || defaultColumns,
      rowData: gridData[item.i] || defaultData,
      onGridReady: (params: GridReadyEvent) => {
        window.gridApis[item.i] = params.api;
      },
      onCellValueChanged,
      getContextMenuItems
    };

    return (
      <Box
        key={item.i}
        className="react-grid-item"
        sx={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          position: 'relative'
        }}>
          <Box 
            className="drag-handle"
            sx={{ 
              flex: 1,
              height: '100%',
              cursor: 'move',
              pl: 1,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Grid #{gridNumber}
          </Box>
          <input
            type="file"
            accept=".xlsx,.csv"
            style={{ display: 'none' }}
            id={`file-input-${item.i}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processFile(file, item.i);
              }
              // Reset input value so the same file can be selected again
              e.target.value = '';
            }}
          />
          <IconButton
            onClick={() => document.getElementById(`file-input-${item.i}`)?.click()}
            size="small"
            sx={{ 
              mr: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <UploadIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={(e) => handleRemoveItem(e, item.i)}
            size="small"
            sx={{ 
              mr: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }} className="ag-theme-balham">
          <AgGridReact {...gridOptions} />
        </Box>
      </Box>
    );
  };

  const layouts = useMemo(() => {
    const result = {
      lg: localItems.map(item => {
        const layoutItem = {
          i: item.i,
          w: item.w || 12,
          h: item.h || 9,
          x: item.x || 0,
          y: item.y || 0,
          static: false,
          type: item.type
        };
        console.log('Creating layout item:', { original: item, layout: layoutItem });
        return layoutItem;
      })
    };
    console.log('Created layouts:', result);
    return result;
  }, [localItems]);

  const onResizeStop = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    console.log('Resize stopped - old item:', oldItem);
    console.log('Resize stopped - new item:', newItem);
    console.log('Resize stopped - full layout:', layout);
    
    // Preserve types in layout
    const layoutWithTypes = layout.map(layoutItem => {
      const originalItem = localItems.find(item => item.i === layoutItem.i);
      return {
        ...layoutItem,
        type: originalItem?.type
      };
    });
    
    // Call parent's onLayoutChange with preserved types
    onLayoutChange(layoutWithTypes);

    // Update local state
    setLocalItems(prev => {
      const newItems = prev.map(item => {
        const layoutItem = layout.find(l => l.i === item.i);
        if (!layoutItem) return item;
        
        return {
          ...item,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      });
      return newItems;
    });
  };

  const onDragStop = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    console.log('Drag stopped - old item:', oldItem);
    console.log('Drag stopped - new item:', newItem);
    console.log('Drag stopped - full layout:', layout);
    
    // Preserve types in layout
    const layoutWithTypes = layout.map(layoutItem => {
      const originalItem = localItems.find(item => item.i === layoutItem.i);
      return {
        ...layoutItem,
        type: originalItem?.type
      };
    });
    
    // Call parent's onLayoutChange with preserved types
    onLayoutChange(layoutWithTypes);

    // Update local state
    setLocalItems(prev => {
      const newItems = prev.map(item => {
        const layoutItem = layout.find(l => l.i === item.i);
        if (!layoutItem) return item;
        
        return {
          ...item,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      });
      return newItems;
    });
  };

  const renderChart = (item: GridItem, ChartComponent: React.ComponentType<any>, chartType: string) => {
    // Get chart number from existing charts of the same type
    const chartNumber = localItems
      .filter(i => i.type === item.type)
      .findIndex(i => i.i === item.i) + 1;

    return (
      <Box
        key={item.i}
        className="react-grid-item"
        sx={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 0 0 2px #2196f3'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '20px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          position: 'relative'
        }}>
          <Box 
            className="drag-handle"
            sx={{ 
              flex: 1,
              height: '100%',
              cursor: 'move',
              pl: 1,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {chartType} #{chartNumber}
          </Box>
          <IconButton
            onClick={(e) => handleRemoveItem(e, item.i)}
            size="small"
            sx={{ 
              mr: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ 
          flex: 1,
          minHeight: 0,
          position: 'relative'
        }}>
          <ChartComponent 
            data={item.chartData || []} 
            chartId={`chart-${item.i}`}
            series={item.chartConfig?.series || []}
            chartConfig={item.chartConfig}
          />
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (onArrangeItems) {
      onArrangeItems = (columns: number) => {
        const itemWidth = Math.floor(12 / columns);
        setLocalItems(prevItems => {
          const newItems = prevItems.map((item, index) => ({
            ...item,
            w: itemWidth,
            h: 9,
            x: (index % columns) * itemWidth,
            y: Math.floor(index / columns) * 9
          }));
          
          // Call parent's onLayoutChange with the new arrangement
          const layoutWithTypes = newItems.map(item => ({
            i: item.i,
            w: item.w,
            h: item.h,
            x: item.x,
            y: item.y,
            type: item.type
          }));
          onLayoutChange(layoutWithTypes);
          
          return newItems;
        });
      };
    }
  }, [onArrangeItems, onLayoutChange]);

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 16
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        compactType="vertical"
        verticalCompact={true}
        useCSSTransforms={true}
        onLayoutChange={onLayoutChange}
        onResizeStop={onResizeStop}
        onDragStop={onDragStop}
        margin={[10, 10]}
        containerPadding={[0, 0]}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
      >
        {localItems.map(item => renderGrid(item))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default GridLayout; 