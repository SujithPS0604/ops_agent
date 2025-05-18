import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// Log the configuration being used
console.log('DynamoDB Client Configuration:', {
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  tableName: process.env.ORDER_TABLE_NAME
});

const client = new DynamoDBClient({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for LocalStack
});

export const getOrders = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.ORDER_TABLE_NAME || 'orders',
    });

    console.log('Executing ScanCommand with params:', {
      tableName: process.env.ORDER_TABLE_NAME || 'orders'
    });

    const response = await client.send(command);
    console.log('Scan response:', JSON.stringify(response, null, 2));
    
    if (!response.Items) {
      console.log('No items found in table');
      return [];
    }

    return response.Items.map(item => unmarshall(item));
  } catch (error) {
    console.error('Error fetching orders from DynamoDB:', {
      error: error.message,
      code: error.code,
      tableName: process.env.ORDER_TABLE_NAME || 'orders',
      stack: error.stack
    });
    throw error;
  }
}; 

export const getOrderTableByOrderId = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('OrderId is required');
    }

    // Ensure orderId is a string
    const orderIdStr = String(orderId);

    const command = new GetItemCommand({
      TableName: process.env.ORDER_TABLE_NAME || 'orders',
      Key: { 
        orderId: { S: orderIdStr } // Explicitly specify the type as String
      },
    });

    console.log('Executing GetItemCommand with params:', {
      tableName: process.env.ORDER_TABLE_NAME || 'orders',
      orderId: orderIdStr
    });
    
    const response = await client.send(command);
    console.log('GetItem response:', JSON.stringify(response, null, 2));
    
    if (!response.Item) {
      console.log(`No order found with ID: ${orderIdStr}`);
      return null;
    }

    const unmarshalledItem = unmarshall(response.Item);
    console.log('Unmarshalled item:', unmarshalledItem);
    return unmarshalledItem;
  } catch (error) {
    console.error('Error fetching order table by order id:', {
      error: error.message,
      code: error.code,
      orderId,
      tableName: process.env.ORDER_TABLE_NAME || 'orders',
      stack: error.stack
    });
    throw error;
  }
};