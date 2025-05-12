import { getConfig } from "../config.js";

const ENVS = new Set(["live", "nonlive"]);

const extractPartnerVariationId = (errorLog) => {
  const { stackTrace, message } = errorLog.firstErrorLogDetails;

  if (stackTrace.indexOf("variation") > -1) {
    const uuids = message.match(
      /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g,
    );
    return uuids && uuids.length > 0 ? uuids : null;
  }

  return null;
};

const getCurrentDateAsString = () => new Date().toISOString().split("T")[0];

const getCurrentTimeAsString = () => {
  const date = new Date();
  return `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
};

const getQueueUrl = (queueName) => {
  const env = getEnvFromProcessArgsOrDefault();
  const accountId = getConfig(env).aws.accountId;
  
  // Use LocalStack endpoint if available
  if (process.env.AWS_ENDPOINT_URL) {
    return `${process.env.AWS_ENDPOINT_URL}/${accountId}/${queueName}`;
  }
  
  // Otherwise use standard AWS URL format
  return `https://sqs.${process.env.AWS_REGION}.amazonaws.com/${accountId}/${queueName}`;
};

const getEnvFromProcessArgsOrDefault = () => {
  const envSelected = process.argv.filter((arg) => ENVS.has(arg));
  if (envSelected.length > 0) {
    return envSelected[0];
  }

  return "live";
};

export {
  extractPartnerVariationId,
  getCurrentDateAsString,
  getCurrentTimeAsString,
  getQueueUrl,
  getEnvFromProcessArgsOrDefault,
};
