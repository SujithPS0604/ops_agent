import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws-v3";
import { getEnvFromProcessArgsOrDefault } from "./common.js";
import { getConfig, commonConfig } from "../config.js";
import { info, error } from "../utils/logger.js";

const env = getEnvFromProcessArgsOrDefault();
let osClient = null;

const initializeOsClient = () => {
  if (osClient === null) {
    const config = getConfig(env);
    const host = config.openSearch.host;
    info(`Initializing OpenSearch client with host: ${host}`);
    
    // For LocalStack or local OpenSearch (no AWS authentication)
    if (host.includes('opensearch:9200') || process.env.AWS_ENDPOINT_URL) {
      osClient = new Client({
        node: host,
        ssl: {
          rejectUnauthorized: false
        }
      });
      info('Using local OpenSearch client with no authentication');
    } else {
      // For AWS OpenSearch Service
      osClient = new Client({
        ...AwsSigv4Signer({
          region: commonConfig.region,
          service: "es",
          getCredentials: () => {
            const credentialsProvider = defaultProvider();
            return credentialsProvider();
          },
        }),
        node: host,
        log: "debug",
        requestTimeout: 10000,
      });
      info('Using AWS OpenSearch client with SigV4 authentication');
    }
  }

  return osClient;
};

const search = async (index, query, size) => {
  const osClient = initializeOsClient();
  
  // Test connection first
  try {
    // List available indices to help debug
    const indicesResponse = await osClient.cat.indices({ format: 'json' });
    info('Available indices:', indicesResponse.body);
  } catch (err) {
    error("OpenSearch cluster health check failed", err);
  }
  
  try {
    info(`Searching in index: ${index} with query:`, query);
    info(`Search size: ${size}`);
    
    // Check if index exists first
    const indexExists = await osClient.indices.exists({ index });
    if (!indexExists.body) {
      error(`Index ${index} does not exist`);
      return [];
    }
    
    const searchParams = {
      index,
      body: {
        query,
        sort: [{ "@timestamp": { order: "desc" } }],
      },
      size,
    };
    
    info(`Search params:`, searchParams);
    
    const response = await osClient.search(searchParams);
    
    if (response.body.hits && response.body.hits.total) {
      info(`Found ${response.body.hits.total.value} matches`);
    } else {
      info(`No matches found in the search results`);
    }
    
    // Log the actual hits for debugging
    if (response.body.hits && response.body.hits.hits && response.body.hits.hits.length > 0) {
      info('First result:', response.body.hits.hits[0]);
    }
    
    return response.body.hits.hits.map(hit => ({
      id: hit._id,
      index: hit._index,
      score: hit._score,
      ...hit._source
    }));
  } catch (err) {
    error(`Search query failed: ${err.message}`, err);
    if (err.meta && err.meta.body) {
      error(`OpenSearch error details:`, err.meta.body);
    }
    return [];
  }
};

export { search };
