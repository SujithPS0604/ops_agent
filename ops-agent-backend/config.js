const config = {
  nonlive: {
    aws: {
      accountId: process.env.AWS_ACCOUNT_ID || '000000000000',
    },
    openSearch: {
      host: process.env.OPENSEARCH_HOST || 'http://localhost:9200',
      indexId: process.env.OPENSEARCH_INDEX_ID || 'logs',
      defaultViewId: process.env.OPENSEARCH_DEFAULT_VIEW_ID || 'default'
    },
  },
};

const commonConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL,
};

const getConfig = (env) => {
  // Default to nonlive if environment is not set
  const environment = process.env.ENVIRONMENT || 'nonlive';
  return config[environment] || config.nonlive;
};

const getOpenSearchPermaLink = (env, key, value) => {
  const configForEnv = config[env];
  return `${configForEnv.openSearch.host}_dashboards/app/discover#/view/${configForEnv.openSearch.defaultViewId}?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${configForEnv.openSearch.indexId}',key:${key}},negate:!f,params:(query:'${value}'),type:phrase),query:(match_phrase:(${key}:'${value}')))),index:'${configForEnv.openSearch.indexId}',interval:auto,query:(language:kuery,query:''),sort:!())`;
};

export { getConfig, getOpenSearchPermaLink, commonConfig };
