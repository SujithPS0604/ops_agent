import {
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import {chunkEvery} from "../utils/process-utils.js";

// Configure SQS client with LocalStack endpoint if available
const clientConfig = { 
  region: process.env.AWS_REGION || "us-east-1"
};

// Add endpoint URL for LocalStack
if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test"
  };
}

const client = new SQSClient(clientConfig);

const params = {
  MaxNumberOfMessages: 10,
  MessageAttributeNames: ["All"],
  VisibilityTimeout: 10,
  WaitTimeSeconds: 0,
};

const receiveMessagesFromSqs = async (queueUrl, visibilityTimeout) => {
  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ["All"],
    VisibilityTimeout: visibilityTimeout || 60,
    WaitTimeSeconds: 0,
  });
  const { Messages } = await client.send(command);

  return Messages ? Messages.map((m) => JSON.parse(m.Body)) : null;
};

const receiveAllMessagesWithMessageIdFromSqs = async (
  queueUrl,
  visibilityTimeout,
) => {
  const messages = [];

  let newlyPulledMessages = [];

  do {
    console.log(`Fetching messages from ${queueUrl}`);
    newlyPulledMessages =
      (await receiveRawMessagesFromSqs(queueUrl, visibilityTimeout)) || [];
    messages.push(...newlyPulledMessages);
  } while (newlyPulledMessages && newlyPulledMessages.length > 0);

  return messages.map(({ Body, MessageId, ReceiptHandle }) => ({
    metadata: {
      messageId: MessageId,
      receiptHandle: ReceiptHandle,
    },
    body: JSON.parse(Body),
  }));
};

const receiveRawMessagesFromSqs = async (queueUrl, visibilityTimeout) => {
  const command = new ReceiveMessageCommand({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    MessageAttributeNames: ["All"],
    VisibilityTimeout: visibilityTimeout || 30,
    WaitTimeSeconds: 10,
  });
  const { Messages } = await client.send(command);

  return Messages ? Messages : null;
};

const processMessagesFromSqs = async (queueUrl, consume, count) => {
  let messages = null;
  let max = count || 999999;
  let n = 0;
  do {
    messages = await receiveRawMessagesFromSqs(queueUrl);
    if (messages) {
      consume(messages);
    }
    n++;
  } while (messages && n < max);
};

const sendMessageToSqs = async (queueUrl, message) => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: message,
    DelaySeconds: 0,
  });
  const response = await client.send(command);

  console.log({ response });
};

const sendMessageBatchToSqs = async (queueUrl, messages) => {
  if (!messages || !messages.length) {
    return;
  }
  const batchSize = 10;
  const totalMessages = messages.length;

  for (let i = 0; i < totalMessages; i += batchSize) {
    const batchMessages = messages.slice(i, i + batchSize);

    let inputParameter = {
      QueueUrl: queueUrl,
      Entries: batchMessages.map((message) => ({
        Id: message.eventId,
        MessageBody: JSON.stringify(message),
        DelaySeconds: 0,
      })),
    };

    const command = new SendMessageBatchCommand(inputParameter);
    const response = await client.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      console.error(
        "Error processing request " +
          JSON.stringify(inputParameter) +
          " : " +
          JSON.stringify(response),
      );
    } else {
      console.log(response);
    }
  }
};

const getMessageCount = async (queueUrl) => {
  const approximateNumberOfMessagesAttribute = "ApproximateNumberOfMessages";
  const input = {
    QueueUrl: queueUrl,
    AttributeNames: [approximateNumberOfMessagesAttribute],
  };
  const command = new GetQueueAttributesCommand(input);
  const response = await client.send(command);

  return parseInt(response.Attributes[approximateNumberOfMessagesAttribute]);
};

const deleteMessageBatch = async (queueUrl, entries) => {
  const chunkSize = 10;

  const promises = chunkEvery(entries, chunkSize).map(
    async (chunkedEntries) => {
      const deleteMessageBatchCommand = new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: chunkedEntries,
      });

      const response = await client.send(deleteMessageBatchCommand);
      if (response.$metadata.httpStatusCode !== 200) {
        console.error(
          "Error processing request " +
            JSON.stringify(entries) +
            " : " +
            JSON.stringify(response),
        );
      } else {
        console.log(response);
      }

      return response;
    },
  );

  await Promise.all(promises);
};

export {
  receiveMessagesFromSqs,
  processMessagesFromSqs,
  receiveRawMessagesFromSqs,
  sendMessageToSqs,
  sendMessageBatchToSqs,
  deleteMessageBatch,
  receiveAllMessagesWithMessageIdFromSqs,
  getMessageCount,
};
