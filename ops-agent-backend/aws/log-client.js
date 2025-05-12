import { search } from "./os-client.js";
import { chunkEvery } from "../utils/process-utils.js";

const DEFAULT_SIZE = 50;
const INDEX = "cwl*";

const _getMatchPhrase = (key, value) => ({ match_phrase: { [key]: value } });

const getLogs = async (filter) => {
  let esFilter = [];
  for (let key in filter) {
    const value = filter[key];
    if (Array.isArray(value)) {
      value.forEach((item) => {
        esFilter.push(_getMatchPhrase(key, item));
      });
    } else {
      esFilter.push(_getMatchPhrase(key, filter[key]));
    }
  }
  const query = {
    bool: {
      must: esFilter,
    },
  };
  return await search(INDEX, query, DEFAULT_SIZE);
};

const getErrorLogs = async (filter) => {
  const newFilter = { ...filter, level: "ERROR" };
  return await getLogs(newFilter);
};

const getErrorLogDetails = (errorLog) => {
  const { _source } = errorLog;
  const { message, stack_trace, serviceName } = _source;
  return {
    message,
    serviceName,
    stackTrace: stack_trace ? `${stack_trace.substring(0, 1000)}...` : "",
  };
};

const getFirstAndLastErrorLog = async (eventId) => {
  const errorLogs = await getErrorLogs({ eventId });
  if (errorLogs && errorLogs.length > 0) {
    const firstErrorLog = errorLogs[0];
    const lastErrorLog = errorLogs[errorLogs.length - 1];
    const firstErrorLogDetails = getErrorLogDetails(firstErrorLog);
    const lastErrorLogDetails = getErrorLogDetails(lastErrorLog);
    return { firstErrorLogDetails, lastErrorLogDetails };
  }

  return null;
};

export const getFirstAndLastErrorLogForEventIds = async (eventIds) => {
  const chunkedEventIds = chunkEvery(eventIds, 5);

  const errorLogMap = {};
  for (const eventIdGroup of chunkedEventIds) {
    await Promise.all(
      eventIdGroup.map(async (eventId) => {
        errorLogMap[eventId] = await getFirstAndLastErrorLog(eventId);
        return Promise.resolve();
      }),
    );
  }

  return errorLogMap;
};

const getLogsByServiceAndMessage = async (serviceName, messages) => {
  const logs = await getLogs({
    "serviceName.keyword": serviceName,
    message: messages,
  });
  return logs.map((log) => {
    const { eventType, eventId, traceId, message, level } = log._source;
    return { eventType, eventId, traceId, message, level };
  });
};


export {
  getLogs,
  getErrorLogs,
  getFirstAndLastErrorLog,
  getLogsByServiceAndMessage,
};
