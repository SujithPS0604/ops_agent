import { Client } from "@opensearch-project/opensearch";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws-v3";
import { getEnvFromProcessArgsOrDefault } from "./common.js";
import { getConfig, commonConfig } from "../config.js";

const env = getEnvFromProcessArgsOrDefault();
let osClient = null;

const initializeOsClient = () => {
  if (osClient === null) {
    const config = getConfig(env);
    const host = config.openSearch.host;
    
    // For LocalStack or local OpenSearch (no AWS authentication)
    if (host.includes('localhost') || process.env.AWS_ENDPOINT_URL) {
      osClient = new Client({
        node: host,
        ssl: {
          rejectUnauthorized: false
        }
      });
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
    }
  }

  return osClient;
};

const search = async (index, query, size) => {
  const osClient = initializeOsClient();
  try {
    const response = await osClient.search({
      index,
      body: {
        query,
        sort: [{ "@timestamp": "asc" }],
      },
      size,
    });
    console.log(JSON.stringify(response));
    return response.body.hits.hits;
  } catch (err) {
    console.error("Search query failed", err);
    return [];
  }
};

export { search };
