import { environment } from '../../environment';

import { PortfolioQueries } from "./portfolio";

import sentryHelper from "../../helpers/sentry.helper";

const rootResolver = sentryHelper.objectMap(
  {
    /** all queries */
    Query: {
      //...PortfolioQueries,
      testMessage: () => environment.secretMessage,
    },
    /** all mutations */
    // Mutation: {
    // },
  },
  sentryHelper.resolversWrapper
);

export default rootResolver;

// export const resolvers = {
//   Query: {
//     testMessage: () => environment.secretMessage,
//   },
// };
