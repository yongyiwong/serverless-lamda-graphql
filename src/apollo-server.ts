import { ApolloServer } from 'apollo-server-lambda';
import * as Sentry from "@sentry/node";
import config from "./config";
import connectDB from "./loaders/database";
import jwt from "jsonwebtoken";

import resolvers from './graphql/resolvers';
import { typeDefs } from './graphql/schema/type-defs';

// Sentry.init({
//   environment: config.sentry.env,
//   dsn: config.sentry.dsn,
// });

connectDB();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      // console.log("error", error);
      return error;
    },
    formatResponse: (response) => {
      // console.log("response", response);
      return response;
    },
    context: ({ event, context }) => ({
      headers: event.headers,
      functionName: context.functionName,
      event,
      context,
      ...getUserFromHeader(event.headers),
    }),
  });
  
  const getUserFromHeader = (headers) => {
    if (process.env.stage === "local" && !headers.Authorization) {
      return {
        id: process.env.permutizelocaluserID,
        email: process.env.permutizelocaluserEmail,
      };
    }
  
    const decoded = jwt.decode(headers.Authorization);
    return { id: decoded.sub, email: decoded.email };
  };

//const apolloServer = new ApolloServer({ resolvers, typeDefs });

export const graphqlHandler = server.createHandler();
