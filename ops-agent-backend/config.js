const config = {
  nonlive: {
    aws: {
      accountId: process.env.AWS_ACCOUNT_ID,
    },
    openSearch: {
      host: process.env.OPENSEARCH_HOST,
      indexId: process.env.OPENSEARCH_INDEX_ID,
      defaultViewId: process.env.OPENSEARCH_DEFAULT_VIEW_ID
    },
  },
};

const commonConfig = {
  region: process.env.AWS_REGION,
};

const getConfig = (env) => {
  return config[process.env.ENVIRONMENT];
};

const getOpenSearchPermaLink = (env, key, value) => {
  const configForEnv = config[env];
  return `${configForEnv.openSearch.host}_dashboards/app/discover#/view/${configForEnv.openSearch.defaultViewId}?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'${configForEnv.openSearch.indexId}',key:${key}},negate:!f,params:(query:'${value}'),type:phrase),query:(match_phrase:(${key}:'${value}')))),index:'${configForEnv.openSearch.indexId}',interval:auto,query:(language:kuery,query:''),sort:!())`;
};

export { getConfig, getOpenSearchPermaLink, commonConfig };
