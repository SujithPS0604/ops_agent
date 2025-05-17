import PsychologyIcon from '@mui/icons-material/Psychology';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  CssBaseline,
  Fade,
  Grow,
  Paper,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import MarkdownResponseView from './components/MarkdownResponseView';
import PipelineView from './components/PipelineView';
import ThinkingView from './components/ThinkingView';
import AdminPanel from './components/AdminPanel';
import MCPAgent from './services/MCPAgent';

// Create animations for the thinking animation
const pulseAnimation = {
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' }
  }
};

const floatAnimation = {
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
    '100%': { transform: 'translateY(0px)' }
  }
};

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
    MuiCssBaseline: {
      styleOverrides: {
        ...pulseAnimation,
        ...floatAnimation
      }
    }
  },
});

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thinkingContent, setThinkingContent] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [thinkingModeEnabled, setThinkingModeEnabled] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

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
      const content = finalMessage.kwargs?.content || finalMessage.content;
      
      // Extract thinking content from <think> tags
      const thinkingMatch = content.match(/\<think\>([\s\S]*?)\<\/think\>/);
      if (thinkingMatch && thinkingMatch[1]) {
        setThinkingContent(thinkingMatch[1].trim() || "-- thinking is turned off --");
      }
      
      return content;
    }
    
    return '';
  };

  // Process response and extract final answer once when response changes
  useEffect(() => {
    if (response?.response?.messages) {
      const answerContent = getFinalAnswer(response.response.messages);
      setFinalAnswer(answerContent);
    } else {
      setFinalAnswer('');
    }
  }, [response]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setThinkingContent('');

    try {
      // Format prompt based on thinking mode
      const formattedPrompt = thinkingModeEnabled ?  prompt : `/no_think ${prompt}`;
      const result = await MCPAgent.invokeAgent(formattedPrompt);
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
      <CssBaseline />
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

          {/* Admin Panel Toggle */}
          <Box sx={{ width: '100%', maxWidth: 1200, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => setAdminPanelOpen(!adminPanelOpen)}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              {adminPanelOpen ? "Hide Admin Panel" : "Show Admin Panel"}
            </Button>
          </Box>

          {/* Admin Panel */}
          <Collapse in={adminPanelOpen} sx={{ width: '100%', maxWidth: 1200, mb: 2 }}>
            <AdminPanel />
          </Collapse>

          {/* Search Form */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              width: '100%', 
              maxWidth: 1200,
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Ask"}
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={thinkingModeEnabled}
                      onChange={(e) => setThinkingModeEnabled(!!e.target.checked)}
                      color="primary"
                      disabled={loading}
                      size="small"
                    />
                  }
                  label="Thinking Mode"
                  sx={{ mx: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPrompt('');
                    setResponse(null);
                    setError(null);
                    setThinkingContent('');
                  }}
                  disabled={loading}
                  sx={{ px: 3 }}
                >
                  Clear
                </Button>
              </Box>
            </form>
          </Paper>

          {/* Thinking indicator */}
          {loading && (
            <Grow in={loading}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  maxWidth: 1200,
                  mb: 4
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3, 
                    borderRadius: '50%',
                    bgcolor: '#E8F0FE',
                    mb: 2,
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}
                >
                  <PsychologyIcon 
                    sx={{ 
                      fontSize: 60, 
                      color: '#4285F4',
                      animation: 'float 3s infinite ease-in-out'
                    }} 
                  />
                </Box>
                <Typography variant="h6" sx={{ color: '#4285F4', fontWeight: 'medium' }}>
                  {thinkingModeEnabled ? "Thinking...🤔" : "Processing...🤖(thinking is disabled)"}
                </Typography>
              </Box>
            </Grow>
          )}

          {/* Display response */}
          {error && (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                width: '100%', 
                maxWidth: 1200, 
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
            <Fade in={!loading}>
              <Card
                elevation={2}
                sx={{
                  width: '100%',
                  maxWidth: 1200,
                  borderRadius: 2,
                  mb: 4
                }}
              >
                <CardContent>
                  {/* Display the markdown response view first */}
                  {response?.response?.messages && 
                    <MarkdownResponseView content={finalAnswer} />
                  }
                  
                  {/* Display thinking content if available */}
                  {thinkingContent && (
                     <ThinkingView content={thinkingContent} />
                  )}
                  
                  <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
                    Internal Process
                  </Typography>
                  <PipelineView response={response} />
                </CardContent>
              </Card>
            </Fade>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;