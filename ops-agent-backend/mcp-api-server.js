import express from 'express';
import { invokeMcpAgent } from './mcp-agent.js';
import { sendDLQMessages, generateOpenSearchLogs } from './test-data-generator.js';
import { getDLQMessages } from './aws/dlq-client.js';
import { getOpenSearchLogs } from './aws/opensearch-client.js';
import fs from 'fs';

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

// API endpoint for generating DLQ messages
app.post('/api/generate/dlq', async (req, res) => {
  try {
    const { count = 1 } = req.body;
    
    if (count < 1 || count > 50) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
    }
    
    console.log(`Generating ${count} DLQ messages`);
    
    const result = await sendDLQMessages(count);
    
    return res.json({
      success: true,
      count: result.count,
      queueUrl: result.queueUrl
    });
  } catch (error) {
    console.error("Error generating DLQ messages:", error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating DLQ messages'
    });
  }
});

// API endpoint for generating OpenSearch events
app.post('/api/generate/opensearch', async (req, res) => {
  try {
    const { count = 1, eventType = 'error' } = req.body;
    
    if (count < 1 || count > 50) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
    }
    
    if (!['error', 'warn', 'info'].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Event type must be one of: error, warn, info'
      });
    }
    
    console.log(`Generating ${count} OpenSearch ${eventType} events`);
    
    const result = await generateOpenSearchLogs(count, eventType);
    
    return res.json({
      success: true,
      count: result.count,
      index: result.index
    });
  } catch (error) {
    console.error("Error generating OpenSearch events:", error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating OpenSearch events'
    });
  }
});

// API endpoint for fetching DLQ messages
app.get('/api/dlq/messages', async (req, res) => {
  try {
    const queueName = req.query.queueName || 'order-queue-dlq';
    console.log(`Fetching messages from queue: ${queueName}`);
    
    const result = await getDLQMessages(queueName);
    
    return res.json({
      success: true,
      count: result.count,
      messages: result.messages
    });
  } catch (error) {
    console.error("Error fetching DLQ messages:", error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching DLQ messages'
    });
  }
});

// API endpoint for fetching messages from all DLQs
app.get('/api/dlq/all-messages', async (req, res) => {
  try {
    // Read DLQs from the configuration file
    const dlqsFilePath = './dlqs.json';
    const dlqs = JSON.parse(fs.readFileSync(dlqsFilePath, 'utf-8'));
    
    console.log(`Fetching messages from ${dlqs.length} DLQs`);
    
    // Process each DLQ and get its messages
    const results = await Promise.all(
      dlqs.map(async (dlq) => {
        const queueName = dlq.dlqName;
        try {
          const result = await getDLQMessages(queueName);
          return {
            queueName,
            source: dlq.source,
            success: true,
            count: result.count,
            messages: result.messages
          };
        } catch (error) {
          console.error(`Error fetching messages from DLQ ${queueName}:`, error);
          return {
            queueName,
            source: dlq.source,
            success: false,
            count: 0,
            messages: [],
            error: error.message || `An error occurred while fetching messages from ${queueName}`
          };
        }
      })
    );
    
    // Calculate total message count
    const totalCount = results.reduce((sum, result) => sum + result.count, 0);
    
    return res.json({
      success: true,
      totalDlqs: dlqs.length,
      totalMessages: totalCount,
      dlqs: results
    });
  } catch (error) {
    console.error("Error fetching all DLQ messages:", error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching all DLQ messages'
    });
  }
});

// API endpoint for fetching OpenSearch logs
app.get('/api/opensearch/logs', async (req, res) => {
  try {
    const indexName = req.query.indexName || 'cwl-logs';
    const level = req.query.level || null;
    const size = parseInt(req.query.size || '50', 10);
    
    console.log(`Fetching logs from index: ${indexName}, level: ${level || 'all'}`);
    
    const result = await getOpenSearchLogs(indexName, level, size);
    
    return res.json({
      success: true,
      count: result.count,
      logs: result.logs
    });
  } catch (error) {
    console.error("Error fetching OpenSearch logs:", error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while fetching OpenSearch logs'
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`MCP API server is running on port ${PORT}`);
});