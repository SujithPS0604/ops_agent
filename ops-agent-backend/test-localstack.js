import 'dotenv/config';
import { SQSClient, ListQueuesCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { getQueueUrl } from "./aws/common.js";

// Print environment variables
console.log('Environment Variables:');
console.log(`AWS_ENDPOINT_URL: ${process.env.AWS_ENDPOINT_URL}`);
console.log(`AWS_REGION: ${process.env.AWS_REGION}`);
console.log(`AWS_ACCOUNT_ID: ${process.env.AWS_ACCOUNT_ID}`);
console.log(`ENVIRONMENT: ${process.env.ENVIRONMENT}`);
console.log('--------------------------------');

// Configure SQS client with LocalStack endpoint
const clientConfig = { 
  region: process.env.AWS_REGION || "us-east-1"
};

// Add endpoint URL for LocalStack
if (process.env.AWS_ENDPOINT_URL) {
  console.log(`Using LocalStack endpoint: ${process.env.AWS_ENDPOINT_URL}`);
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test"
  };
}

console.log(`SQS Client Config: ${JSON.stringify(clientConfig)}`);
const client = new SQSClient(clientConfig);

// Test functions
async function listQueues() {
  try {
    const command = new ListQueuesCommand({});
    console.log('Sending ListQueuesCommand...');
    const response = await client.send(command);
    console.log('Available queues:');
    console.log(response.QueueUrls);
    return response.QueueUrls;
  } catch (error) {
    console.error('Error listing queues:', error);
    console.error('Error metadata:', JSON.stringify(error.$metadata));
    return [];
  }
}

async function getQueueMessageCount(queueName) {
  try {
    const queueUrl = getQueueUrl(queueName);
    console.log(`Queue URL for ${queueName}: ${queueUrl}`);
    
    const approximateNumberOfMessagesAttribute = "ApproximateNumberOfMessages";
    const input = {
      QueueUrl: queueUrl,
      AttributeNames: [approximateNumberOfMessagesAttribute],
    };
    console.log(`Sending GetQueueAttributesCommand with input: ${JSON.stringify(input)}`);
    const command = new GetQueueAttributesCommand(input);
    const response = await client.send(command);
    
    const count = parseInt(response.Attributes[approximateNumberOfMessagesAttribute]);
    console.log(`Message count for ${queueName}: ${count}`);
    return count;
  } catch (error) {
    console.error(`Error getting message count for queue ${queueName}:`, error);
    if (error.$metadata) {
      console.error(`Error metadata: ${JSON.stringify(error.$metadata)}`);
    }
    return -1;
  }
}

// Run tests
async function runTests() {
  console.log('Starting LocalStack tests...');
  
  // List all queues
  const queues = await listQueues();
  
  // Check specific queues
  if (queues && queues.length > 0) {
    // Extract queue names from URLs
    const queueNames = queues.map(url => {
      const parts = url.split('/');
      return parts[parts.length - 1];
    });
    
    console.log('\nChecking message counts for each queue:');
    for (const queueName of queueNames) {
      await getQueueMessageCount(queueName);
    }
  } else {
    console.log('No queues found. Make sure LocalStack is running and queues are created.');
  }

  // Test specific DLQ
  console.log('\nTesting order-queue-dlq specifically:');
  await getQueueMessageCount('order-queue-dlq');
}

// Run all tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 