import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from './Chat';
import { OpenAIService } from '../services/OpenAIService';

jest.mock('../services/OpenAIService');

describe('Chat', () => {
  const mockProps = {
    onClose: jest.fn(),
    onExecuteMacro: jest.fn(),
    onMacroLoad: jest.fn(),
  };

  it('renders without crashing', () => {
    render(<Chat {...mockProps} />);
    expect(screen.getByPlaceholderText('Describe what you want to visualize...')).toBeInTheDocument();
  });

  it('sends a message when the send button is clicked', async () => {
    const mockGenerateMacro = jest.fn().mockResolvedValue({
        prompt: 'Test message',
        steps: [],
    });
    (OpenAIService.getInstance as jest.Mock).mockReturnValue({
        generateMacro: mockGenerateMacro,
    });

    render(<Chat {...mockProps} />);
    const input = screen.getByPlaceholderText('Describe what you want to visualize...');
    // The send button is not explicitly rendered, the handleSend function is called on key press
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockGenerateMacro).toHaveBeenCalledWith('Test message');
    });
  });
});
