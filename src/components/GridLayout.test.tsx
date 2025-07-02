import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridLayout from './GridLayout';
import { act } from 'react';

describe('GridLayout Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  test('loads and displays grid with data from Excel file', async () => {
    const mockItems = [{
      i: 'grid-1',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    }];

    const mockOnRemoveItem = jest.fn();

    render(
      <GridLayout
        items={mockItems}
        onRemoveItem={mockOnRemoveItem}
      />
    );

    // Check if grid is rendered
    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Import the Excel file directly
    const excelFile = require('../__fixtures__/my-data.xlsx');
    
    const file = new File(
      [excelFile],
      'my-data.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    // Simulate drag and drop
    const dropZone = screen.getByRole('grid').closest('.react-grid-item');
    expect(dropZone).toBeInTheDocument();

    await act(async () => {
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });
      dropZone?.dispatchEvent(dropEvent);
    });

    // Check if data is loaded
    await waitFor(() => {
      // Check column headers
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Check grid cells
      const gridCells = screen.getAllByRole('gridcell');
      expect(gridCells.length).toBeGreaterThan(0);

      // Check if last column contains data
      const lastColumnCells = gridCells.slice(-headers.length);
      lastColumnCells.forEach(cell => {
        expect(cell.textContent).toBeTruthy();
      });
    });
  });
}); 