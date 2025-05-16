import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MCPAgent from './services/MCPAgent';
import PipelineView from './components/PipelineView';
import MarkdownResponseView from './components/MarkdownResponseView';

// Google-inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Google Blue
    },
    secondary: {
      main: '#34A853', // Google Green
    },
    error: {
      main: '#EA4335', // Google Red
    },
    warning: {
      main: '#FBBC05', // Google Yellow
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to extract final answer content
  const getFinalAnswer = (messages) => {
    if (!messages || messages.length === 0) return '';
    
    // Find the final AI message with content (last AIMessage without tool calls)
    const finalMessage = [...messages].reverse().find(msg => {
      const msgType = msg.id?.[msg.id?.length - 1] || 
                     (msg.type || 
                      ((msg.content || msg.kwargs?.content) && !msg.name ? 'AIMessage' : 
                       (msg.name && msg.content ? 'ToolMessage' : 'Unknown')));
      
      return msgType === 'AIMessage' && (!msg.tool_calls || msg.tool_calls.length === 0)
        && (msg.kwargs?.content || msg.content);
    });
    
    if (finalMessage) {
      return finalMessage.kwargs?.content || finalMessage.content;
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await MCPAgent.invokeAgent(prompt);
      setResponse(result);
    } catch (err) {
      console.error('Error invoking Ops agent:', err);

      // Enhanced error handling for connection issues
      if (err.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('Cannot connect to the API server. Please make sure the API server is running at http://localhost:3002');
      } else {
        setError(err.message || 'Failed to get response from Ops agent');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            minHeight: '100vh', 
            pt: 8
          }}
        >
          {/* Logo */}
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              mb: 4,
              fontWeight: 400,
              '& .blue': { color: '#4285F4' },
              '& .red': { color: '#EA4335' },
              '& .yellow': { color: '#FBBC05' },
              '& .green': { color: '#34A853' }
            }}
          >
            <span className="blue">O</span>
            <span className="red">P</span>
            <span className="yellow">S</span>
            <span> </span>
            <span className="green">Agent</span>
          </Typography>

          {/* Search Form */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              width: '100%', 
              maxWidth: 584,
              borderRadius: 3,
              mb: 4
            }}
          >
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your prompt..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  InputProps={{
                    sx: { 
                      borderRadius: 3,
                      '& fieldset': { 
                        borderColor: 'transparent' 
                      },
                      '&:hover fieldset': { 
                        borderColor: 'transparent' 
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: 'transparent' 
                      }
                    }
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !prompt.trim()}
                  sx={{ mr: 1, px: 3 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Ops Search"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPrompt('');
                    setResponse(null);
                    setError(null);
                  }}
                  disabled={loading}
                  sx={{ px: 3 }}
                >
                  Clear
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Display response */}
          {error && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                width: '100%', 
                maxWidth: 700, 
                borderRadius: 2,
                bgcolor: '#FEECEB',
                color: '#D93025',
                mb: 2
              }}
            >
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                Error
              </Typography>
              <Typography variant="body1">
                {error}
              </Typography>
            </Paper>
          )}

          {response && !error && (
            <Card
              elevation={2}
              sx={{
                width: '100%',
                maxWidth: 700,
                borderRadius: 2,
                mb: 4
              }}
            >
              <CardContent>
                {/* Display the markdown response view first */}
                {response?.response?.messages && 
                  <MarkdownResponseView content={getFinalAnswer(response.response.messages)} />
                }
                
                <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
                  Pipeline Details
                </Typography>
                <PipelineView response={response} />
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;