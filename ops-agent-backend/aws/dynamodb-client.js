import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const fetchItemDynamoDb = async (table, key) => {
  const command = new GetCommand({
    TableName: table,
    Key: key,
  });

  const response = await docClient.send(command);
  return response.Item;
};

export { fetchItemDynamoDb };
