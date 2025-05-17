import { getQueueUrl } from './common.js';
import { receiveAllMessagesWithMessageIdFromSqs, getMessageCount } from './sqs-client.js';

/**
 * Get messages from a DLQ
 * @param {string} queueName - The name of the queue to fetch messages from
 * @param {number} visibilityTimeout - How long to keep the messages invisible to other consumers
 * @returns {Promise<Array>} - Array of messages with metadata
 */
const getDLQMessages = async (queueName = 'order-queue-dlq', visibilityTimeout = 30) => {
  try {
    const queueUrl = getQueueUrl(queueName);
    console.log(`Fetching messages from DLQ: ${queueName}, URL: ${queueUrl}`);
    
    // Get message count first
    const count = await getMessageCount(queueUrl);
    console.log(`Queue ${queueName} has ${count} messages`);
    
    // If queue is empty, return empty array
    if (count === 0) {
      return { messages: [], count: 0 };
    }
    
    // Receive all messages
    const messages = await receiveAllMessagesWithMessageIdFromSqs(queueUrl, visibilityTimeout);
    console.log(`Retrieved ${messages.length} messages from queue`);
    
    return { 
      messages: messages.map(msg => ({
        id: msg.metadata.messageId,
        ...msg.body
      })),
      count: messages.length
    };
  } catch (error) {
    console.error(`Error fetching messages from DLQ ${queueName}:`, error);
    throw error;
  }
};

export { getDLQMessages }; 