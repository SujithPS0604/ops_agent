import express from 'express';
import { invokeMcpAgent } from './mcp-agent.js';

const app = express();

// Enable CORS manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Parse JSON requests
app.use(express.json());

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP API server is running' });
});

// API endpoint for invoking the MCP agent
app.post('/api/invoke', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    console.log(`Processing prompt: ${prompt}`);

    // Mock response for testing without invoking the actual agent
    const response =  await invokeMcpAgent(prompt);

    console.log({response});

    // Return the response to the React UI
    return res.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error("Error during mock execution:", error);

    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing your request'
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`MCP API server is running on port ${PORT}`);
});