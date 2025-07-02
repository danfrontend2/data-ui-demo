import React, { useState } from 'react';
import RGL, { WidthProvider, Layout } from 'react-grid-layout';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { LayoutItem, GridData } from '../types';
import * as XLSX from 'xlsx';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ReactGridLayout = WidthProvider(RGL);

interface GridLayoutProps {
  items: LayoutItem[];
  onRemoveItem: (itemId: string) => void;
}

const GridLayout: React.FC<GridLayoutProps> = ({ items, onRemoveItem }) => {
  // State для хранения данных каждого грида
  const [gridData, setGridData] = useState<{ [key: string]: any[] }>({});
  const [columnDefs, setColumnDefs] = useState<{ [key: string]: ColDef[] }>({});

  // Sample data for initial grid state
  const defaultData: GridData[] = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 },
  ];

  const defaultColumns: ColDef[] = [
    { field: 'id' },
    { field: 'name' },
    { field: 'value' },
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
      
      // Читаем данные с явным указанием всех опций
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        blankrows: false,
        defval: '',
        rawNumbers: true
      });

      if (jsonData.length > 0) {
        // Получаем все ключи и создаем маппинг для безопасных имен
        const keyMapping = Array.from(
          new Set(
            jsonData.reduce((keys: string[], row: any) => {
              return keys.concat(Object.keys(row));
            }, [])
          )
        ).reduce((acc: { [key: string]: string }, key: string) => {
          // Заменяем точки на безопасный символ в ключе для внутреннего использования
          const safeKey = key.replace(/\./g, '_');
          acc[key] = safeKey;
          return acc;
        }, {});

        console.log('Key mapping:', keyMapping);

        // Функция для преобразования строки с разделителями тысяч в число
        const parseNumberWithSeparators = (value: string | number): number | string => {
          if (typeof value === 'number') return value;
          if (typeof value !== 'string') return value;
          
          // Убираем пробелы и кавычки
          const cleanValue = value.trim().replace(/["']/g, '');
          
          // Если строка пустая, возвращаем пустую строку
          if (cleanValue === '') return '';
          
          // Заменяем запятые-разделители на пустую строку и пробуем преобразовать в число
          const numberStr = cleanValue.replace(/,/g, '');
          const num = Number(numberStr);
          
          return !isNaN(num) ? num : value;
        };

        // Создаем колонки на основе всех найденных ключей
        const columns = Object.entries(keyMapping).map(([originalKey, safeKey]) => {
          // Проверяем тип данных по всем строкам
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
            type: hasNumericValue ? 'numericColumn' : undefined,
            valueFormatter: hasNumericValue
              ? (params: any) => {
                  if (params.value === null || params.value === undefined || params.value === '') return '';
                  const num = typeof params.value === 'number' 
                    ? params.value 
                    : parseNumberWithSeparators(params.value);
                  return typeof num === 'number' ? num.toLocaleString() : params.value;
                }
              : undefined
          };
        });

        // Нормализуем данные, используя безопасные ключи
        const formattedData = jsonData.map((row: any) => {
          const newRow: Record<string, any> = {};
          Object.entries(keyMapping).forEach(([originalKey, safeKey]) => {
            const value = row[originalKey];
            newRow[safeKey] = parseNumberWithSeparators(value);
          });
          return newRow;
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

  return (
    <ReactGridLayout
      className="layout"
      layout={items}
      cols={12}
      rowHeight={30}
      draggableHandle=".drag-handle"
      isResizable={true}
      isDraggable={true}
      onLayoutChange={(newLayout: Layout[]) => {
        console.log('Layout changed:', newLayout);
      }}
    >
      {items.map((item) => (
        <div key={item.i} className="grid-item">
          <Box
            className="grid-item-header"
            sx={{
              padding: '8px',
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'flex-end',
              position: 'relative',
            }}
          >
            <Box 
              sx={{ 
                flex: 1, 
                cursor: 'move',
                height: '100%'
              }} 
              className="drag-handle"
            />
            <IconButton
              size="small"
              onClick={(e) => handleRemoveItem(e, item.i)}
              sx={{
                marginLeft: 'auto',
                zIndex: 1000,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <div
            className="ag-theme-alpine"
            style={{ height: 'calc(100% - 40px)', width: '100%' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.i)}
          >
            <AgGridReact
              rowData={gridData[item.i] || defaultData}
              columnDefs={columnDefs[item.i] || defaultColumns}
              suppressMovableColumns={true}
              animateRows={true}
            />
          </div>
        </div>
      ))}
    </ReactGridLayout>
  );
};

export default GridLayout; 