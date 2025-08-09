import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/Toolbar', () => () => <div data-testid="toolbar" />);
jest.mock('./components/GridLayout', () => () => <div data-testid="grid-layout" />);
jest.mock('./components/Chat', () => () => <div data-testid="chat" />);
jest.mock('./components/MacroPanel', () => () => <div data-testid="macro-panel" />);

describe('App', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders all the main components', () => {
    render(<App />);
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('grid-layout')).toBeInTheDocument();
  });
});
