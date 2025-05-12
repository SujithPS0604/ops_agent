import { Parser } from "@json2csv/plainjs";
import fs from "fs";
import { getOpenSearchPermaLink } from "../config.js";
import { createDirectoryRecursively, writeToFileSync, } from "../utils/file-util.js";
import {
  getCurrentDateAsString,
  getCurrentTimeAsString,
  getEnvFromProcessArgsOrDefault,
  getQueueUrl,
} from "./common.js";
import { getFirstAndLastErrorLogForEventIds } from "./log-client.js";
import { getMessageCount, receiveRawMessagesFromSqs, } from "./sqs-client.js";

export const run = async (maxMessagesToFetch) => {
  const dlqs = JSON.parse(fs.readFileSync("./dlqs.json", "utf-8"));
  const messageCounts = await Promise.all(
    dlqs
      .map((dlq) => dlq.dlqName)
      .map(async (dlqName) => {
        const queueUrl = getQueueUrl(dlqName);
        const messageCount = await getMessageCount(queueUrl);
        return { dlqName, queueUrl, messageCount };
      }),
  );
  let result = await Promise.all(
      messageCounts
          .filter((dlq) => dlq.messageCount > 0)
          .map(
              async (dlq) =>
                  await fetchDlqDetails(
                      dlq.dlqName,
                      dlq.queueUrl,
                      dlq.messageCount,
                      maxMessagesToFetch,
                  ),
          ),
  );
  console.log(result);
  return result;
};

const fetchDlqDetails = async (
  queueName,
  queueUrl,
  messageCount,
  maxMessageCount,
) => {
  const parser = new Parser();
  let results = [];
  let messages = [];
  let n = 0;

  const maxMessage =
    messageCount < maxMessageCount ? messageCount : maxMessageCount;
  const backupPath = `./backup/${queueName}/${getCurrentDateAsString()}`;
  let dlqSummaryPath = `./dlq-summary`;

  createDirectoryRecursively(backupPath);
  createDirectoryRecursively(dlqSummaryPath);
  do {
    messages = await receiveRawMessagesFromSqs(queueUrl);
    if (messages) {
      const promises = messages.map(async (m) => {
        const { MessageId, Body } = m;
        const body = JSON.parse(Body);
        const { eventId, traceId, eventTime, type } = body;
        writeToFileSync(`${backupPath}/${eventId}.json`, JSON.stringify(body));

        return {
          MessageId,
          eventId,
          traceId,
          eventTime,
          type,
          Body,
        };
      });
      const values = await Promise.all(promises);
      results.push(...values);
      console.log(`Processed ${results.length} messages from ${queueName}`);
    }
    n++;
  } while (messages && results.length < maxMessage);

  const enrichedMessages = await enrichLogData(results);
  let csvData = parser.parse(enrichedMessages);
  let path = `${dlqSummaryPath}/${appendEnvAndTimeStamp(queueName)}.csv`;
  writeToFileSync(
    path,
    csvData,
  );
  console.log(`DLQ summary saved to ${path}`);
  return enrichedMessages;
};

const enrichLogData = async (messages) => {
  const eventIds = messages.map((message) => message.eventId);
  const logByEventIds = await getFirstAndLastErrorLogForEventIds(eventIds);
  return messages.map((message) => {
    const logs = logByEventIds[message.eventId];
    let env = getEnvFromProcessArgsOrDefault();
    return {
      ...message,
      ...logs,
      searchByEventId: getOpenSearchPermaLink(env, "eventId", message.eventId),
      searchByTraceId: getOpenSearchPermaLink(env, "traceId", message.traceId),
    };
  });
};

const appendEnvAndTimeStamp = (name) =>
  `${name}-${getEnvFromProcessArgsOrDefault()}-${getCurrentDateAsString()}-${getCurrentTimeAsString()}`;
