import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Toolbar from './Toolbar';

jest.mock('./PromptsMenu', () => () => <div data-testid="prompts-menu" />);

describe('Toolbar', () => {
  const mockProps = {
    onAddItem: jest.fn(),
    onRunMacro: jest.fn(),
    onCloseAll: jest.fn(),
    onCloseMacroPanel: jest.fn(),
    onRunCustomMacro: jest.fn(),
    onArrangeItems: jest.fn(),
    onMacroLoad: jest.fn(),
    items: [],
    isMacroPanelOpen: false,
    showInitialGlow: false,
    forceTooltipOpen: false,
    onShowTimeClick: jest.fn(),
    onUserInteraction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Toolbar {...mockProps} />);
    expect(screen.getByLabelText('Add new grid')).toBeInTheDocument();
  });

  it('calls onAddItem when Add Item button is clicked', () => {
    render(<Toolbar {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Add new grid'));
    expect(mockProps.onAddItem).toHaveBeenCalled();
  });

  it('renders the PromptsMenu component', () => {
    render(<Toolbar {...mockProps} />);
    expect(screen.getByTestId('prompts-menu')).toBeInTheDocument();
  });

  it('calls onCloseAll when Close All button is clicked', () => {
    render(<Toolbar {...mockProps} />);
    fireEvent.click(screen.getByLabelText('Close all items'));
    expect(mockProps.onCloseAll).toHaveBeenCalled();
  });
});
