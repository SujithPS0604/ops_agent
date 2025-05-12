import { fetchItemDynamoDb } from "../aws/dynamodb-client.js";
import {
  deleteMessageBatch,
  receiveAllMessagesWithMessageIdFromSqs,
} from "../aws/sqs-client.js";
import { createDirectoryRecursively, writeToFileSync } from "./file-util.js";

const ORDER_TABLE_NAME = process.env.ORDER_TABLE_NAME;

const writeEventsBodyToFile = (events, backupDirectory) => {
  events
    .map(({ body }) => body)
    .forEach((message) => {
      const { eventId } = message;
      writeToFileSync(
        `${backupDirectory}/${eventId}.json`,
        JSON.stringify(message),
      );
    });
};

export const fetchRawAllMessagesFromDlqAndCreateBackup = async (
  dlqUrl,
  backupDirectory,
  visibilityTimeout,
) => {
  createDirectoryRecursively(backupDirectory);

  const events = await receiveAllMessagesWithMessageIdFromSqs(
    dlqUrl,
    visibilityTimeout,
  );

  writeEventsBodyToFile(events, backupDirectory);

  console.log(`Backed up the events to ${backupDirectory} directory`);

  return events;
};

export const deleteMessagesFromDlq = (dlqUrl, messageNeedsToBeDeleted) => {
  if (messageNeedsToBeDeleted.length === 0) return Promise.resolve();

  const entries = messageNeedsToBeDeleted.map(
    ({ metadata: { receiptHandle, messageId } }) => ({
      Id: messageId,
      ReceiptHandle: receiptHandle,
    }),
  );
  console.log(
    `Deleting message from ${dlqUrl} with ${JSON.stringify(entries)}`,
  );
  return deleteMessageBatch(dlqUrl, entries);
};

export const getItemsStatusFromOrder = (salesOrderId, itemIds) => {
  return fetchItemDynamoDb(ORDER_TABLE_NAME, {
    salesOrderId,
  })
    .then((order) =>
      order.positions
        .flatMap(({ positionItems }) => positionItems)
        .filter((positionItem) => itemIds.indexOf(positionItem.id) !== -1)
        .map(({ id: positionItemId, status }) => ({ positionItemId, status })),
    )
    .catch((reason) => {
      console.error(
        `Unable to fetch order from db with sales order id ${salesOrderId}`,
        reason,
      );
      return [];
    });
};

export const chunkEvery = (entries, chunkSize) =>
  [...Array(Math.ceil(entries.length / chunkSize))].map((_, i) =>
    entries.slice(i * chunkSize, (i + 1) * chunkSize),
  );
