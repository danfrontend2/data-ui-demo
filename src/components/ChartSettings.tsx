import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Slider, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ActionManager from '../services/ActionManager';
import { GridItem } from '../types';

interface ChartSettingsProps {
  onClose: () => void;
  items: GridItem[];
  selectedChartId?: string;
}

// Available color sets in amCharts 5
const COLOR_SETS = {
  'Default': 'default',
  'Kelly': 'kelly',
  'Material': 'material',
  'Vividark': 'vividark',
  'Dataviz': 'dataviz',
  'Moonrisekingdom': 'moonrisekingdom',
  'Spirited': 'spirited'
};

const ChartSettings: React.FC<ChartSettingsProps> = ({ onClose, items, selectedChartId }) => {
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [colorSet, setColorSet] = useState('kelly');
  const actionManager = ActionManager.getInstance();

  // Get current settings from the selected chart
  useEffect(() => {
    const selectedChart = items.find(item => 
      (item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') &&
      (selectedChartId ? item.i === selectedChartId : true)
    );
    
    if (selectedChart) {
      setOpacity(selectedChart.chartConfig?.opacity ?? 1);
      setStrokeWidth(selectedChart.chartConfig?.strokeWidth ?? 2);
      setColorSet(selectedChart.chartConfig?.colorSet ?? 'kelly');
    }
  }, [items, selectedChartId]);

  const handleOpacityChange = (_event: Event, value: number | number[]) => {
    const newOpacity = value as number;
    setOpacity(newOpacity);
    actionManager.logAction('UPDATE_CHART_OPACITY', { 
      opacity: newOpacity,
      chartId: selectedChartId 
    });
  };

  const handleStrokeWidthChange = (_event: Event, value: number | number[]) => {
    const newStrokeWidth = value as number;
    setStrokeWidth(newStrokeWidth);
    actionManager.logAction('UPDATE_CHART_STROKE_WIDTH', { 
      strokeWidth: newStrokeWidth,
      chartId: selectedChartId
    });
  };

  const handleColorSetChange = (event: any) => {
    const newColorSet = event.target.value;
    setColorSet(newColorSet);
    actionManager.logAction('UPDATE_CHART_COLOR_SET', { 
      colorSet: newColorSet,
      chartId: selectedChartId
    });
  };

  // Get the selected chart's name
  const getSelectedChartName = () => {
    const selectedChart = items.find(item => 
      (item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') &&
      (selectedChartId ? item.i === selectedChartId : true)
    );

    if (!selectedChart) return '';

    const chartTypeNames = {
      'bar-chart': 'Bar Chart',
      'pie-chart': 'Pie Chart',
      'line-chart': 'Line Chart'
    };

    const chartType = chartTypeNames[selectedChart.type as keyof typeof chartTypeNames];
    const chartNumber = items
      .filter(i => i.type === selectedChart.type)
      .findIndex(i => i.i === selectedChart.i) + 1;

    return `${chartType} #${chartNumber}`;
  };

  const isChartSelected = items.some(item => 
    (item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') &&
    (selectedChartId ? item.i === selectedChartId : true)
  );

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '300px',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1,
        borderBottom: '1px solid #ddd'
      }}>
        <Typography variant="h6">{getSelectedChartName()}</Typography>
        <Button onClick={onClose} size="small">Close</Button>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <FormControl fullWidth>
          <InputLabel id="color-set-label">Color Set</InputLabel>
          <Select
            labelId="color-set-label"
            value={colorSet}
            label="Color Set"
            onChange={handleColorSetChange}
            disabled={!isChartSelected}
          >
            {Object.entries(COLOR_SETS).map(([label, value]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography gutterBottom>Fill Opacity</Typography>
          <Slider
            value={opacity}
            onChange={handleOpacityChange}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            marks={[
              { value: 0, label: '0' },
              { value: 0.5, label: '0.5' },
              { value: 1, label: '1' }
            ]}
            disabled={!isChartSelected}
          />
        </Box>

        <Box>
          <Typography gutterBottom>Stroke Width</Typography>
          <Slider
            value={strokeWidth}
            onChange={handleStrokeWidthChange}
            min={1}
            max={10}
            step={1}
            valueLabelDisplay="auto"
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' }
            ]}
            disabled={!isChartSelected}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default ChartSettings; 