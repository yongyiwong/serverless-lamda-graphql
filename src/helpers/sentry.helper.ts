import { AuthenticationError } from "apollo-server-lambda";
import * as Sentry from "@sentry/node";

const objectMap = (object, mapper) =>
  Object.entries(object).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: mapper(value, key),
    }),
    {}
  );

const resolversWrapper = (resolvers) =>
  objectMap(resolvers, (resolver, name) => async (...args) => {
    try {
      const result = await resolver(...args);
      return result;
    } catch (err) {
      if (err instanceof AuthenticationError) {
        throw err;
      }
      // eslint-disable-next-line no-console
      console.error("ERROR: ", err, args);
      const [variables, context] = args.slice(1);
      Sentry.withScope((scope) => {
        scope.setExtra("resolver", name);
        scope.setExtra("variables", variables);
        scope.setExtra("context", context);
        Sentry.captureException(err);
      });
      await Sentry.flush(2000);

      throw new Error("INTERNAL_SERVER_ERROR");
    }
  });

export default {
  resolversWrapper,
  objectMap,
};
