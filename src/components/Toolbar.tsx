import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';

interface ToolbarProps {
  onAddGrid: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddGrid }) => {
  return (
    <Box
      sx={{
        width: '60px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
      }}
    >
      <Tooltip title="Add Grid" placement="right">
        <IconButton onClick={onAddGrid} size="large">
          <GridViewIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default Toolbar; 