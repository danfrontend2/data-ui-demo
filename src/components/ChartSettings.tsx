import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Slider, Button } from '@mui/material';
import ActionManager from '../services/ActionManager';
import { GridItem } from '../types';

interface ChartSettingsProps {
  onClose: () => void;
  items: GridItem[];
}

const ChartSettings: React.FC<ChartSettingsProps> = ({ onClose, items }) => {
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const actionManager = ActionManager.getInstance();

  // Get current settings from the first chart if only one exists
  useEffect(() => {
    const charts = items.filter(item => item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart');
    if (charts.length === 1) {
      setOpacity(charts[0].chartConfig?.opacity ?? 1);
      setStrokeWidth(charts[0].chartConfig?.strokeWidth ?? 2);
    }
  }, [items]);

  const handleOpacityChange = (_event: Event, value: number | number[]) => {
    const newOpacity = value as number;
    setOpacity(newOpacity);

    // Only update if there's exactly one chart
    const charts = items.filter(item => item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart');
    if (charts.length === 1) {
      actionManager.logAction('UPDATE_CHART_OPACITY', { opacity: newOpacity });
    }
  };

  const handleStrokeWidthChange = (_event: Event, value: number | number[]) => {
    const newStrokeWidth = value as number;
    setStrokeWidth(newStrokeWidth);

    // Only update if there's exactly one chart
    const charts = items.filter(item => item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart');
    if (charts.length === 1) {
      actionManager.logAction('UPDATE_CHART_STROKE_WIDTH', { strokeWidth: newStrokeWidth });
    }
  };

  const isChartSelected = items.filter(item => 
    item.type === 'bar-chart' || item.type === 'pie-chart' || item.type === 'line-chart'
  ).length === 1;

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
        <Typography variant="h6">Chart Settings</Typography>
        <Button onClick={onClose} size="small">Close</Button>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
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