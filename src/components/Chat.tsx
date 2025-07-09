import React, { useState, useEffect } from 'react';
import { Box, TextField, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { OpenAIService } from '../services/OpenAIService';
import ActionManager from '../services/ActionManager';
import { MacroData } from '../types/actions';

interface Message {
  text: string;
  isUser: boolean;
  macro?: any;
  error?: string;
}

interface ChatProps {
  onClose: () => void;
  onExecuteMacro?: (macro: any) => Promise<void>;
  onMacroLoad?: (macroData: MacroData) => void;
  prefilledMessage?: string;
  shouldAutoSend?: boolean;
  onMessageSent?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onClose, onExecuteMacro, onMacroLoad, prefilledMessage, shouldAutoSend, onMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  
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
      
      // Show macro in MacroPanel and auto-start execution
      if (onMacroLoad && macro.prompt && macro.steps) {
        // Add ARRANGE action to the end of steps
        const arrangeAction: any = {
          id: `arrange_${Date.now()}`,
          timestamp: Date.now(),
          type: 'ARRANGE',
          details: {
            columns: 2
          },
          message: 'Arranging items in 2 columns'
        };

        const macroWithArrange = {
          ...macro,
          steps: [...macro.steps, arrangeAction]
        };

        onMacroLoad(macroWithArrange);
        
        // Auto-start the macro execution
        setTimeout(() => {
          ActionManager.getInstance().executeMacro(macroWithArrange.steps);
        }, 100);
        
        const aiMessage: Message = {
          text: 'Macro generated and started! Check the macro panel to control execution.',
          isUser: false,
          macro: macroWithArrange
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid macro format');
      }
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

  // Handle prefilled message
  useEffect(() => {
    if (prefilledMessage) {
      setInput(prefilledMessage);
      setHasAutoSent(false); // Reset auto-send flag when new message arrives
    }
  }, [prefilledMessage]);

  // Handle auto-send separately to ensure handleSend is available
  useEffect(() => {
    if (prefilledMessage && shouldAutoSend && !isLoading && !hasAutoSent && input === prefilledMessage) {
      // Auto-send after a small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setHasAutoSent(true);
        handleSend();
        if (onMessageSent) {
          onMessageSent();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [prefilledMessage, shouldAutoSend, input, isLoading, hasAutoSent, onMessageSent, handleSend]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      let textToCopy = message.text;
      if (message.macro) {
        textToCopy += '\n\n' + JSON.stringify(message.macro, null, 2);
      }
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
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
              maxWidth: '90%',
              position: 'relative',
              '&:hover .copy-button': {
                opacity: 1
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>{message.text}</Typography>
              <Tooltip title="Copy message">
                <IconButton
                  className="copy-button"
                  size="small"
                  onClick={() => handleCopyMessage(message)}
                  sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    minWidth: 24,
                    height: 24,
                    p: 0.25,
                    ml: 0.5
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
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
          <Box 
            sx={{ 
              mt: 1,
              width: '100%',
              height: '40px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: 'gradientShift 3s ease-in-out infinite',
              '@keyframes gradientShift': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              }
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              AI is thinking
              <Box
                sx={{
                  display: 'inline-flex',
                  '& span': {
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'inline-block',
                    margin: '0 1px',
                    animation: 'bounce 1.4s ease-in-out infinite both',
                  },
                  '& span:nth-child(1)': { animationDelay: '-0.32s' },
                  '& span:nth-child(2)': { animationDelay: '-0.16s' },
                  '& span:nth-child(3)': { animationDelay: '0s' },
                  '@keyframes bounce': {
                    '0%, 80%, 100%': { 
                      transform: 'scale(0)',
                      opacity: 0.5
                    },
                    '40%': { 
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  }
                }}
              >
                <span />
                <span />
                <span />
              </Box>
            </Typography>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 2s infinite',
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default Chat; 