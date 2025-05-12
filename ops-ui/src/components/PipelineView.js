import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Component to display messages in a pipeline view
const PipelineView = ({ response }) => {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);

  // Extract messages from the response
  const messages = response?.response?.messages || [];

  // Get message type based on message structure
  const getMessageType = (message) => {
    // Get message type from the id array's last element
    if (message.id && Array.isArray(message.id)) {
      const lastElement = message.id[message.id.length - 1];
      return lastElement;
    }

    // Fallbacks for different structures
    if (message.name && message.content && (message.tool_call_id || message.name.includes('__'))) {
      return 'ToolMessage';
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      return 'AIMessage'; // AIMessage with tool calls
    }

    if ((message.content || message.kwargs?.content) && !message.name) {
      return 'AIMessage'; // AIMessage with content
    }

    // Return the type if available or fallback to Unknown
    return message.type || 'Unknown';
  };

  // Helper function to get stage name and icon
  const getStageInfo = (message, index) => {
    const messageType = message.id?.[message.id.length - 1] || getMessageType(message);

    switch (messageType) {
      case 'HumanMessage':
        return {
          name: 'User Query',
          icon: <ChatIcon fontSize="small" />,
          color: '#EA4335' // Red
        };
      case 'AIMessage':
        // Check if this is a tool call or final answer
        if (message.kwargs.tool_calls && message.kwargs.tool_calls.length > 0) {
          return {
            name: 'Tool Call',
            icon: <BuildIcon fontSize="small" />,
            color: '#FBBC05' // Yellow
          };
        } else {
          return {
            name: 'AI Response',
            icon: <CheckCircleIcon fontSize="small" />,
            color: '#4285F4' // Blue
          };
        }
      case 'ToolMessage':
        return {
          name: 'Tool Result',
          icon: <CodeIcon fontSize="small" />,
          color: '#34A853' // Green
        };
      default:
        return {
          name: `Stage ${index + 1}`,
          icon: null,
          color: '#9AA0A6' // Gray
        };
    }
  };

  // Helper function to get tool information from the message
  const getToolInfo = (message) => {
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      return {
        name: toolCall.name,
        displayName: toolCall.name.split('__').pop(),
        args: toolCall.args,
        id: toolCall.id
      };
    }

    if (message.name) {
      return {
        name: message.name,
        displayName: message.name.split('__').pop(),
        content: message.content,
        id: message.tool_call_id
      };
    }

    return null;
  };

  // Render message details based on the type
  const renderMessageDetails = (message, index) => {

    const messageType = message.id?.[message.id.length - 1] || getMessageType(message);

    // For human messages (user queries)
    if (messageType === 'HumanMessage') {
      // Get content from the right location depending on structure
      const content = message.kwargs?.content || message.content;

      return (
        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3f1', borderColor: '#ffcdd2' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {content}
            </Typography>
          </Paper>
        </Box>
      );
    }

    // For AI messages with tool calls
    if (messageType === 'AIMessage' && message.kwargs.tool_calls?.length > 0) {
      const toolCall = message.kwargs.tool_calls[0];
      const toolName = toolCall.name.split('__').pop();

      return (
        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff8e1', borderColor: '#ffe082' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#f57c00' }}>
              {toolName}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Arguments:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                bgcolor: '#f5f5f5',
                borderRadius: 1
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0
                }}
              >
                {typeof toolCall.args === 'string'
                  ? toolCall.args
                  : JSON.stringify(toolCall.args, null, 2)}
              </Typography>
            </Paper>
          </Paper>
        </Box>
      );
    }

    // For tool messages (results)
    if (messageType === 'ToolMessage') {
      // Get content from the right location
      let displayContent = message.kwargs?.content || message.content;
      const toolName = (message.name || message.kwargs?.name || '').split('__').pop() || 'Tool Result';

      // Try to pretty-print JSON if it's a string containing JSON
      if (typeof displayContent === 'string' && displayContent.trim().startsWith('{')) {
        try {
          const parsedContent = JSON.parse(displayContent);
          displayContent = JSON.stringify(parsedContent, null, 2);
        } catch (e) {
          // If parsing fails, use as-is
        }
      }

      return (
        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e8f5e9', borderColor: '#c8e6c9' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              {toolName}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" color="text.secondary">
              Output:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1,
                bgcolor: '#f5f5f5',
                borderRadius: 1
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0
                }}
              >
                {displayContent}
              </Typography>
            </Paper>
          </Paper>
        </Box>
      );
    }

    // For final AI response messages
    if (messageType === 'AIMessage' && (!message.kwargs.tool_calls || message.kwargs.tool_calls.length === 0)) {
      const content = message.kwargs?.content || message.content;

      return (
        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e3f2fd', borderColor: '#bbdefb' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Final Response
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {content}
            </Typography>
          </Paper>
        </Box>
      );
    }

    // Default fallback - display the raw message data
    return (
      <Box sx={{ mt: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', borderColor: '#e0e0e0' }}>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.75rem',
              m: 0
            }}
          >
            {JSON.stringify(message, null, 2)}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      {/* Pipeline visualization */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: '#f8f9fa'
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Pipeline Events
        </Typography>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            overflowX: 'auto',
            py: 1,
            px: 0.5
          }}
        >
          {messages.map((message, index) => {
            const { name, icon, color } = getStageInfo(message, index);

            return (
              <React.Fragment key={index}>
                <Button
                  variant={selectedMessageIndex === index ? "contained" : "outlined"}
                  color="primary"
                  size="small"
                  onClick={() => setSelectedMessageIndex(index)}
                  startIcon={icon}
                  sx={{
                    bgcolor: selectedMessageIndex === index ? color : 'transparent',
                    color: selectedMessageIndex === index ? 'white' : 'text.primary',
                    borderColor: color,
                    borderRadius: '16px',
                    '&:hover': {
                      bgcolor: selectedMessageIndex === index ? color : `${color}20`
                    },
                    textTransform: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {name}
                </Button>
                {index < messages.length - 1 && (
                  <ArrowForwardIcon color="disabled" sx={{ my: 'auto', mx: 0.5 }} />
                )}
              </React.Fragment>
            );
          })}
        </Stack>
      </Paper>

      {/* Selected message details */}
      {selectedMessageIndex !== null && messages[selectedMessageIndex] && (
        <Box>
          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Event Details
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#fcfcfc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                label={messages[selectedMessageIndex].id?.[messages[selectedMessageIndex].id.length - 1] || getMessageType(messages[selectedMessageIndex])}
                size="small"
                icon={getStageInfo(messages[selectedMessageIndex], selectedMessageIndex).icon}
                sx={{
                  bgcolor: getStageInfo(messages[selectedMessageIndex], selectedMessageIndex).color,
                  color: 'white',
                  mr: 1,
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
              <Typography variant="subtitle1" fontWeight="bold">
                {getStageInfo(messages[selectedMessageIndex], selectedMessageIndex).name}
              </Typography>
            </Box>

            {renderMessageDetails(messages[selectedMessageIndex], selectedMessageIndex)}
          </Paper>
        </Box>
      )}

      {/* Show final answer prominently if available and no stage is selected */}
      {selectedMessageIndex === null && messages.length > 0 && (
        (() => {
          // Find the final AI message with content (last AIMessage without tool calls)
          const finalMessage = [...messages].reverse().find(msg => {
            const msgType = msg.id?.[msg.id?.length - 1] || getMessageType(msg);
            return msgType === 'AIMessage' && (!msg.tool_calls || msg.tool_calls.length === 0)
              && (msg.kwargs?.content || msg.content);
          });

          if (finalMessage) {
            const content = finalMessage.kwargs?.content || finalMessage.content;

            return (
              <Box sx={{ mt: 1 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#f0f7ff',
                    borderColor: '#4285F4',
                    borderWidth: 2
                  }}
                >
                  <Typography variant="h6" gutterBottom color="#4285F4" sx={{ fontWeight: 'bold' }}>
                    Final Answer
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                  </Typography>
                </Paper>
              </Box>
            );
          }

          return null;
        })()
      )}

      {/* Raw data accordion */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: '#f5f5f5',
            borderRadius: '4px'
          }}
        >
          <Typography sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Raw Response Data
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            variant="body2"
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              bgcolor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontSize: '0.75rem'
            }}
          >
            {JSON.stringify(response, null, 2)}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PipelineView;