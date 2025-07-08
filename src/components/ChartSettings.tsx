import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Slider, Button, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const actionManager = ActionManager.getInstance();

  // Animate slider value change
  const animateSliderChange = async (
    currentValue: number, 
    targetValue: number, 
    setter: (value: number) => void,
    duration: number = 1000
  ) => {
    setIsAnimating(true);
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = (targetValue - currentValue) / steps;

    for (let i = 0; i <= steps; i++) {
      const newValue = currentValue + (increment * i);
      setter(newValue);
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    setIsAnimating(false);
  };

  // Animate color set change with brief highlight
  const animateColorSetChange = async (targetColorSet: string) => {
    setIsAnimating(true);
    // Brief flash animation before changing
    await new Promise(resolve => setTimeout(resolve, 200));
    setColorSet(targetColorSet);
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsAnimating(false);
  };

  // Get current settings from the selected chart
  useEffect(() => {
    const selectedChart = items.find(item => 
      (item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart') &&
      (selectedChartId ? item.i === selectedChartId : true)
    );
    
    if (selectedChart && !isAnimating) {
      const newOpacity = selectedChart.chartConfig?.opacity ?? 1;
      const newStrokeWidth = selectedChart.chartConfig?.strokeWidth ?? 2;
      const newColorSet = selectedChart.chartConfig?.colorSet ?? 'kelly';
      
      // Check if values changed (indicating programmatic change from macro)
      const opacityChanged = Math.abs(opacity - newOpacity) > 0.01;
      const strokeWidthChanged = strokeWidth !== newStrokeWidth;
      const colorSetChanged = colorSet !== newColorSet;
      
      if (opacityChanged) {
        animateSliderChange(opacity, newOpacity, setOpacity, 800);
      } else if (strokeWidthChanged) {
        animateSliderChange(strokeWidth, newStrokeWidth, setStrokeWidth, 800);
      } else if (colorSetChanged) {
        animateColorSetChange(newColorSet);
      } else {
        // No animation needed, just set values directly
        setOpacity(newOpacity);
        setStrokeWidth(newStrokeWidth);
        setColorSet(newColorSet);
      }
    }
  }, [items, selectedChartId, isAnimating]);

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
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <FormControl 
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.3s ease',
              ...(isAnimating && colorSet !== 'kelly' ? {
                backgroundColor: 'rgba(103, 126, 234, 0.1)',
                boxShadow: '0 0 10px rgba(103, 126, 234, 0.3)',
              } : {})
            }
          }}
        >
          <InputLabel id="color-set-label">Color Set</InputLabel>
          <Select
            labelId="color-set-label"
            value={colorSet}
            label="Color Set"
            onChange={handleColorSetChange}
            disabled={!isChartSelected || isAnimating}
          >
            {Object.entries(COLOR_SETS).map(([label, value]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box 
          sx={{
            '& .MuiSlider-root': {
              transition: 'all 0.3s ease',
              ...(isAnimating ? {
                '& .MuiSlider-thumb': {
                  boxShadow: '0 0 10px rgba(103, 126, 234, 0.5)',
                  backgroundColor: '#677eea',
                }
              } : {})
            }
          }}
        >
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
            disabled={!isChartSelected || isAnimating}
          />
        </Box>

        <Box 
          sx={{
            '& .MuiSlider-root': {
              transition: 'all 0.3s ease',
              ...(isAnimating ? {
                '& .MuiSlider-thumb': {
                  boxShadow: '0 0 10px rgba(103, 126, 234, 0.5)',
                  backgroundColor: '#677eea',
                }
              } : {})
            }
          }}
        >
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
            disabled={!isChartSelected || isAnimating}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default ChartSettings; 