import axios from "axios";

import config from "../config";

const { graphQLurl, apiKey } = config.priceService;

export const getTokensLatestPrice = async (tokens: string[]): Promise<any> => {
  const headers = {
    "x-api-key": apiKey,
  };

  return new Promise((resolve) => {
    axios({
      url: graphQLurl,
      method: "POST",
      headers,
      data: {
        query: `
        query quotes($tokens: [String]!) {
          quotes(symbols: $tokens, interval: LATEST) {
            id,
            symbol,
            fiat_symbol,
            count,
            quotes {
              price,
              last_updated,
            },
          }
        }
      `,
        variables: {
          tokens,
        },
      },
    })
      .then((result) => {
        resolve(result.data);
      })
      .catch((err) => {
        console.error(err.response.data);
        resolve(null);
      });
  });
};

export const getTokensPriceList = async (
  tokens: string[],
  fromDate: Date,
  toDate: Date,
  interval = "LATEST"
): Promise<any> => {
  const headers = {
    "x-api-key": apiKey,
  };

  return new Promise((resolve) => {
    axios({
      url: graphQLurl,
      method: "POST",
      headers,
      data: {
        query: `
        query quotes($tokens: [String]!, $start_date: Date, $end_date: Date) {
          quotes(symbols: $tokens, start_date: $start_date, end_date: $end_date, interval: ${interval}) {
            id,
            symbol,
            fiat_symbol,
            count,
            quotes {
              price,
              last_updated,
            },
          }
        }
      `,
        variables: {
          tokens,
          start_date: fromDate.getTime(),
          end_date: toDate.getTime(),
        },
      },
    })
      .then((result) => {
        resolve(result.data);
      })
      .catch((err) => {
        console.error(err.response.data);
        resolve(null);
      });
  });
};
