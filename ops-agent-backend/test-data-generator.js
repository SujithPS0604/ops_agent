import { v4 as uuidv4 } from 'uuid';
import { getQueueUrl } from './aws/common.js';
import { sendMessageBatchToSqs } from './aws/sqs-client.js';
import { Client } from '@opensearch-project/opensearch';

// Sample error messages for DLQ
const errorMessages = [
  'Connection timeout while processing order',
  'Database query failed: foreign key constraint violation',
  'Invalid product ID specified in order',
  'Payment processing failed: insufficient funds',
  'Order validation failed: missing required fields',
  'Service unavailable: retry later',
  'API rate limit exceeded',
  'Invalid JSON format in request',
  'Authentication failed: invalid credentials',
  'Data processing error: unexpected input format'
];

// Sample error stacks
const errorStacks = [
  'Error: Connection timeout\n    at processOrder (/app/services/orderService.js:145:23)\n    at async handleRequest (/app/controllers/orderController.js:67:12)',
  'Error: Database error\n    at executeQuery (/app/db/queryExecutor.js:212:11)\n    at processPayment (/app/services/paymentService.js:78:14)',
  'TypeError: Cannot read property \'id\' of undefined\n    at validateProduct (/app/validators/productValidator.js:26:41)\n    at processOrderItems (/app/services/orderService.js:183:19)',
  'RangeError: Invalid array length\n    at parseOrderItems (/app/utils/parsers.js:58:12)\n    at processOrder (/app/services/orderService.js:122:32)',
  'SyntaxError: Unexpected token } in JSON at position 117\n    at JSON.parse (<anonymous>)\n    at parseRequest (/app/utils/requestParser.js:42:19)'
];

// Sample service names
const serviceNames = [
  'order-service',
  'payment-service',
  'inventory-service',
  'user-service',
  'notification-service',
  'shipping-service',
  'product-service',
  'analytics-service',
  'auth-service',
  'email-service'
];

// Generate random error for DLQ
const generateRandomDLQMessage = () => {
  const timestamp = new Date().toISOString();
  const orderId = uuidv4();
  const errorId = uuidv4();
  const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  const errorStack = errorStacks[Math.floor(Math.random() * errorStacks.length)];
  const serviceName = serviceNames[Math.floor(Math.random() * serviceNames.length)];
  
  return {
    eventId: errorId,
    timestamp,
    serviceName,
    errorDetails: {
      message: errorMessage,
      stack: errorStack,
      orderId,
      timestamp
    },
    metadata: {
      environment: Math.random() > 0.5 ? 'production' : 'staging',
      region: Math.random() > 0.5 ? 'us-east-1' : 'eu-west-1',
      version: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`
    }
  };
};

// Generate OpenSearch log event
const generateOpenSearchEvent = (eventType) => {
  const timestamp = new Date().toISOString();
  const eventId = uuidv4();
  const serviceName = serviceNames[Math.floor(Math.random() * serviceNames.length)];
  const userId = `user_${Math.floor(Math.random() * 10000)}`;
  
  let message, level;
  
  switch (eventType) {
    case 'error':
      message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      level = 'ERROR';
      break;
    case 'warn':
      message = `Warning: ${errorMessages[Math.floor(Math.random() * errorMessages.length)].toLowerCase()}`;
      level = 'WARN';
      break;
    case 'info':
    default:
      message = `Successfully processed request for user ${userId}`;
      level = 'INFO';
      break;
  }
  
  return {
    '@timestamp': timestamp,
    event_id: eventId,
    service: serviceName,
    level,
    message,
    user_id: userId,
    request_id: uuidv4(),
    duration_ms: Math.floor(Math.random() * 5000),
    status_code: eventType === 'error' ? 500 : (eventType === 'warn' ? 400 : 200),
    metadata: {
      environment: Math.random() > 0.5 ? 'production' : 'staging',
      region: Math.random() > 0.5 ? 'us-east-1' : 'eu-west-1',
      version: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`
    }
  };
};

// Send messages to DLQ
const sendDLQMessages = async (count) => {
  const messages = [];
  
  for (let i = 0; i < count; i++) {
    messages.push(generateRandomDLQMessage());
  }
  
  try {
    const queueUrl = getQueueUrl('order-queue-dlq');
    await sendMessageBatchToSqs(queueUrl, messages);
    return { success: true, count, queueUrl };
  } catch (err) {
    console.error('Error sending DLQ messages:', err);
    throw err;
  }
};

// Index events in OpenSearch
const indexOpenSearchEvents = async (events, indexName = 'cwl-logs') => {
  // Get OpenSearch client configuration
  const config = {
    node: process.env.OPENSEARCH_HOST || 'http://opensearch:9200',
    ssl: { rejectUnauthorized: false }
  };
  
  console.log(`Connecting to OpenSearch at ${config.node}`);
  const client = new Client(config);
  
  // Check if index exists, create if not
  const indexExists = await client.indices.exists({ index: indexName });
  
  if (!indexExists.body) {
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            'message': { type: 'text' },
            'level': { type: 'keyword' },
            'service': { type: 'keyword' },
            'user_id': { type: 'keyword' },
            'request_id': { type: 'keyword' },
            'duration_ms': { type: 'integer' },
            'status_code': { type: 'integer' },
            'metadata': { 
              properties: {
                'environment': { type: 'keyword' },
                'region': { type: 'keyword' },
                'version': { type: 'keyword' }
              }
            }
          }
        }
      }
    });
  }
  
  // Bulk index the events
  const body = events.flatMap(doc => [
    { index: { _index: indexName } },
    doc
  ]);
  
  const { body: bulkResponse } = await client.bulk({ body });
  
  if (bulkResponse.errors) {
    console.error('Errors in bulk indexing:', bulkResponse.errors);
    const errorItems = bulkResponse.items.filter(item => item.index.error);
    console.error('Error details:', errorItems);
    throw new Error('Failed to index all documents in OpenSearch');
  }
  
  return { success: true, count: events.length, index: indexName };
};

// Generate and send OpenSearch events
const generateOpenSearchLogs = async (count, eventType) => {
  const events = [];
  
  for (let i = 0; i < count; i++) {
    events.push(generateOpenSearchEvent(eventType));
  }
  
  try {
    return await indexOpenSearchEvents(events);
  } catch (err) {
    console.error('Error indexing OpenSearch events:', err);
    throw err;
  }
};

export { sendDLQMessages, generateOpenSearchLogs }; 