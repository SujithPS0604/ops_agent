import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const getOrders = async () => {
  try {
    const command = new ScanCommand({
      TableName: 'orders',
    });

    const response = await client.send(command);
    return response.Items.map(item => unmarshall(item));
  } catch (error) {
    console.error('Error fetching orders from DynamoDB:', error);
    throw error;
  }
}; 