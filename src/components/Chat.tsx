import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { OpenAIService } from '../services/OpenAIService';
import ActionManager from '../services/ActionManager';

interface Message {
  text: string;
  isUser: boolean;
  macro?: any;
  error?: string;
}

interface ChatProps {
  onClose: () => void;
  onExecuteMacro?: (macro: any) => Promise<void>;
}

const Chat: React.FC<ChatProps> = ({ onClose, onExecuteMacro }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const openAIService = OpenAIService.getInstance();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get macro from OpenAI
      const macro = await openAIService.generateMacro(input);
      
      // Try to execute macro
      if (onExecuteMacro) {
        await onExecuteMacro(macro);
        // After AI-generated macro execution, arrange in 2 columns
        ActionManager.getInstance().logAction('ARRANGE', { columns: 2 });
      }

      const aiMessage: Message = {
        text: 'Macro generated and executed successfully!',
        isUser: false,
        macro: macro
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        text: `Error: ${error.message}`,
        isUser: false,
        error: error.message
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '400px', // Increased width
        height: '500px', // Increased height
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
        <Typography variant="h6">AI Assistant</Typography>
        <Button onClick={onClose} size="small">Close</Button>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              backgroundColor: message.isUser ? '#e3f2fd' : message.error ? '#ffebee' : '#f5f5f5',
              borderRadius: '8px',
              p: 1,
              maxWidth: '90%'
            }}
          >
            <Typography variant="body2">{message.text}</Typography>
            {message.macro && (
              <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: '4px' }}>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(message.macro, null, 2)}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
        <TextField
          fullWidth
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe what you want to visualize..."
          multiline
          maxRows={3}
          disabled={isLoading}
        />
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default Chat; 