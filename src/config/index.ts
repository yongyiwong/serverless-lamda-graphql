export default {
  /**
   * mongoDB atlas connection uri
   */
  databaseURL: process.env.MONGODB_URI,
  /**
   * coinbase credentials
   */
  binanceUS: {
    baseURI:process.env.BINANCE_US_ENDPOINT_URL
  },
  coinbase: {
    tokenEndpoint: process.env.CB_TOKEN_ENDPOINT_URI,
    proBaseURI: process.env.CB_PRO_BASE_URI,
    baseURI: process.env.CB_BASE_URI,
    clientId: process.env.CB_CLIENT_ID,
    clientSecret: process.env.CB_CLIENT_SECRET,
    redirectUri: process.env.CB_REDIRECT_URL,
  },
  /**
   * coin price service
   */
  priceService: {
    graphQLurl: process.env.PRICE_GRAPHQL_API_URL,
    apiKey: process.env.PRICE_GRAPHQL_API_KEY,
  },
  /**
   * sentry config
   */
  sentry: {
    dsn: process.env.SENTRY_DSN,
    env: process.env.SENTRY_ENVIRONMENT,
  },
};
