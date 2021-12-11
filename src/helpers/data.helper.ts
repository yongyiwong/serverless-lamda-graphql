/**
 * Data helper to aggregate transaction data
 * intervals:
 * - last 24 hours: 30 minutes
 * - last 1 week: 2 hours
 * - last 1 month: 6 hours
 * - others: 1 day
 */

import BigNumber from "bignumber.js";

import {
  ITransaction,
  ITransactionTokenProps,
} from "../interfaces/models/transaction";
import { IPortfolioTransaction } from "../interfaces/models/portfolio_transaction";
import { IWalletMetadata } from "../interfaces/models/wallet_metadata";

// import PortfolioTransaction from "../models/portfolio_transaction.model";
// import WalletMetadata from "../models/wallet_metadata.model";
import { getTokensPriceList } from "./token.helper";

let moment = require("moment");
if ("default" in moment) {
  moment = moment["default"];
}

type AggregatedTransactions = {
  [key: string]: IPortfolioTransaction;
};

/**
 * round off date based on difference from current date
 * intervals: 30minutes, 12 hours, 1 day
 *
 * @param date
 * @returns rounded off date
 */
const roundOffDate = (date: Date, dateToRoundOff: Date): Date => {
  const currentDate = moment(date)
    .set({ seconds: 0, milliseconds: 0 })
    .add(30 - (moment(date).minutes() % 30), "minutes");
  const txDate = moment(dateToRoundOff);

  const timeParams: {
    milliseconds: number;
    seconds: number;
    minutes?: number;
    hours?: number;
  } = {
    seconds: 0,
    milliseconds: 0,
  };

  if (txDate.isSameOrAfter(moment(currentDate).subtract(1, "days"))) {
    // last 24 hours
    txDate.add(30 - (txDate.minutes() % 30), "minutes");
  } else if (txDate.isSameOrAfter(moment(currentDate).subtract(7, "days"))) {
    // last 7 days
    txDate.add(2 - (txDate.hours() % 2), "hours");
    timeParams.minutes = 0;
  } else if (txDate.isSameOrAfter(moment(currentDate).subtract(30, "days"))) {
    // last 30 days
    txDate.add(6 - (txDate.hours() % 6), "hours");
    timeParams.minutes = 0;
  } else {
    // more than 30 days
    txDate.add(1, "days");
    timeParams.hours = 0;
    timeParams.minutes = 0;
  }

  txDate.set(timeParams);
  return txDate.toDate();
};

const getPreviousPoint = (date: Date, diffDate: Date): Date => {
  const prevDate = new moment(date)
    .set({ seconds: 0, milliseconds: 0 })
    .add(30 - (moment(date).minutes() % 30), "minutes");
  const timeParams: {
    milliseconds: number;
    seconds: number;
    minutes?: number;
    hours?: number;
  } = {
    seconds: 0,
    milliseconds: 0,
  };
  if (prevDate.isSameOrAfter(moment(diffDate).subtract(1, "days"))) {
    // last 24 hours
    prevDate.subtract(30, "minutes");
  } else if (prevDate.isSameOrAfter(moment(diffDate).subtract(7, "days"))) {
    // last 7 days
    prevDate.subtract(2, "hours");
    timeParams.minutes = 0;
  } else if (prevDate.isSameOrAfter(moment(diffDate).subtract(30, "days"))) {
    // last 30 days
    prevDate.subtract(6, "hours");
    timeParams.minutes = 0;
  } else {
    // more than 30 days
    prevDate.subtract(1, "days");
    timeParams.hours = 0;
    timeParams.minutes = 0;
  }

  prevDate.set(timeParams);
  return prevDate.toDate();
};

const getDateRange = (
  fromDate: Date,
  toDate: Date
): {
  fromDate: Date;
  toDate: Date;
} => {
  const currentDate = moment();
  const newDate = moment(toDate).set({ seconds: 0, milliseconds: 0 });
  // .add(30 - (moment(toDate).minutes() % 30), "minutes");
  // newDate.add(30, "minutes");

  return {
    fromDate: roundOffDate(currentDate, fromDate),
    toDate: roundOffDate(currentDate, newDate),
  };
};

/**
 * Write balance aggregated data to mongoDB
 *
 * @param portfolioTransactions
 */
const writeToDB = async (portfolioTransactions: IPortfolioTransaction[]) => {
  // await PortfolioTransaction.bulkWrite(
  //   portfolioTransactions.map((transaction: IPortfolioTransaction) => ({
  //     updateOne: {
  //       filter: {
  //         dateTime: transaction.dateTime,
  //         platform_id: transaction.platform_id,
  //         wallet_address: transaction.wallet_address,
  //       },
  //       update: {
  //         $set: transaction,
  //       },
  //       upsert: true,
  //     },
  //   }))
  // );
};

/**
 * Function to modify token prices JSON into following format
 * { date: { token: price } }
 * Updates the priceQuotes object passed in parameter
 *
 * @param response
 * @param priceQuotes
 * @returns void
 */
const _processTokenPriceJSON = (response: any, priceQuotes: any): void => {
  if (!response) {
    return;
  }

  response.data.quotes.forEach((item) => {
    const { symbol, quotes } = item;
    quotes.forEach((quote) => {
      const date = getPreviousPoint(new Date(quote.last_updated), new Date());
      date.setSeconds(0);
      date.setMilliseconds(0);

      if (!(date.toISOString() in priceQuotes)) {
        priceQuotes[date.toISOString()] = {};
      }
      priceQuotes[date.toISOString()][symbol] = quote.price;
    });
  });
};

/**
 * Function to get token prices for different date range
 * with different intervals
 *
 * @param dateRangeByInterval
 * @param tokens
 * @returns
 */
const getTokenPricesByInterval = async (
  dateRangeByInterval: any,
  tokens: string[]
) => {
  const tokenPricePromises: Promise<any>[] = [];
  const priceQuotes = {};

  Object.keys(dateRangeByInterval).forEach((interval: string) => {
    if (
      dateRangeByInterval[interval].start_date &&
      dateRangeByInterval[interval].end_date
    ) {
      const startDate = new Date(dateRangeByInterval[interval].start_date);
      startDate.setMinutes(startDate.getMinutes() - 60);
      const endDate = new Date(dateRangeByInterval[interval].end_date);
      endDate.setMinutes(endDate.getMinutes() + 60);

      tokenPricePromises.push(
        getTokensPriceList(tokens, startDate, endDate, interval).then(
          (result) => _processTokenPriceJSON(result, priceQuotes)
        )
      );
    }
  });

  await Promise.all(tokenPricePromises);
  return priceQuotes;
};

/**
 * Function to update start and end date for date range intervals
 *
 * @param dateRangeByInterval
 * @param interval
 * @param date
 */
const _updateDateRangeInterval = (
  dateRangeByInterval: any,
  interval: string,
  date: Date
): void => {
  if (!dateRangeByInterval[interval].end_date) {
    dateRangeByInterval[interval].end_date = date;
  }
  dateRangeByInterval[interval].start_date = date;
};

/**
 * Function to get all dates between from and to date
 * with defined intervals.
 *
 * @param fromDate
 * @param toDate
 * @returns
 */
const getAllDatePoints = (
  fromDate: Date,
  toDate: Date,
  diffDate: Date
): { allDates: Date[]; dateRangeByInterval: any } => {
  const endDate = moment(toDate);
  const datePointer = moment(endDate);
  // endDate.subtract(30, "minutes");
  const allDates: Date[] = [];

  const dateRangeByInterval = {};
  ["FORTYEIGHT", "TWELVE", "FOUR", "ONE"].map((interval) => {
    dateRangeByInterval[interval] = {
      start_date: null,
      end_date: null,
    };
  });

  allDates.push(datePointer.toDate());
  _updateDateRangeInterval(
    dateRangeByInterval,
    "FORTYEIGHT",
    datePointer.toDate()
  );

  while (
    datePointer.isAfter(moment(fromDate)) &&
    datePointer.isSameOrBefore(moment(endDate))
  ) {
    let currentInterval = "FORTYEIGHT";
    if (datePointer.isSameOrAfter(moment(diffDate).subtract(1, "days"))) {
      // last 24 hours
      datePointer.subtract(30, "minutes");
    } else if (
      datePointer.isSameOrAfter(moment(diffDate).subtract(7, "days"))
    ) {
      // last 7 days
      datePointer.set({ minutes: 0 });
      datePointer.subtract(2 - (datePointer.hours() % 2), "hours");
      currentInterval = "TWELVE";
    } else if (
      datePointer.isSameOrAfter(moment(diffDate).subtract(30, "days"))
    ) {
      // last 30 days
      datePointer.set({ minutes: 0 });
      const diff = datePointer.hours() % 6;
      datePointer.subtract(diff ? diff : 6, "hours");
      currentInterval = "FOUR";
    } else {
      // more than 30 days
      datePointer.set({ hours: 0, minutes: 0 });
      datePointer.subtract(1, "days");
      currentInterval = "ONE";
    }

    allDates.push(datePointer.toDate());
    _updateDateRangeInterval(
      dateRangeByInterval,
      currentInterval,
      datePointer.toDate()
    );
  }

  return {
    // sort by asc
    allDates: allDates.sort((a, b) => (a > b ? 1 : b > a ? -1 : 0)),
    dateRangeByInterval,
  };
};

/**
 * Function to get historical token balances for all
 * data points within from and to date based on defined intervals
 *
 * @param toDate
 * @param fromDate
 * @param aggTrx
 * @returns
 */
const _processHistoricalDataPoints = async (
  aggTrx: AggregatedTransactions,
  allDates: Date[],
  tokenPrices: any
): Promise<IPortfolioTransaction[]> => {
  const portfolioTransactions: IPortfolioTransaction[] = [];
  const lastKey = Object.keys(aggTrx);
  let lastObj: IPortfolioTransaction = aggTrx[lastKey[lastKey.length - 1]];
  const lastTokenPrice: {
    [key: string]: number;
  } = {};

  allDates.forEach((date: Date) => {
    const dateStr = date.toISOString();
    lastObj = dateStr in aggTrx ? Object.assign({}, aggTrx[dateStr]) : lastObj;

    const balancesUSD: { [key: string]: number } = {};
    Object.keys(lastObj.balances).forEach((token) => {
      const tokenUSDPrice = tokenPrices[dateStr]
        ? tokenPrices[dateStr][token] || 0
        : lastTokenPrice[token] || 0;

      balancesUSD[token] = tokenUSDPrice
        ? Number(lastObj.balances[token]) * tokenUSDPrice
        : Number(lastObj.balances_usd ? lastObj.balances_usd[token] || 0 : 0);

      if (tokenUSDPrice) lastTokenPrice[token] = tokenUSDPrice;
    });

    portfolioTransactions.push({
      ...lastObj,
      dateTime: date,
      balances_usd: balancesUSD,
    });
  });

  return portfolioTransactions;
};

/**
 * Aggregate balance into different time intervals
 * for bitcoin
 *
 * @param platformId
 * @param walletAddress
 * @param balances
 */
const aggregateBTCBalances = async (
  platformId: number,
  walletAddress: string,
  balances: any,
  allDates: Date[],
  historicalPrice: any
): Promise<void> => {
  const aggTrx: AggregatedTransactions = {};
  const currentDate = new Date();
  let minDate = new Date(currentDate);
  const tokenId = "BTC";

  balances.forEach((item) => {
    const trxDateTime = roundOffDate(currentDate, item.timestamp);
    minDate = minDate < trxDateTime ? minDate : trxDateTime;

    if (!(trxDateTime.toISOString() in aggTrx)) {
      aggTrx[trxDateTime.toISOString()] = {
        dateTime: trxDateTime,
        platform_id: platformId,
        wallet_address: walletAddress,
        balances: { [tokenId]: item.balance },
        balances_usd: {},
      };
    }
  });

  const portfolioTransactions = await _processHistoricalDataPoints(
    aggTrx,
    allDates,
    historicalPrice
  );
  await writeToDB(portfolioTransactions);
};

/**
 * Function to aggregate transaction data into multiple intervals
 * for portfolio chart
 * toDo: handle in between transactions which are delayed
 * (get balance from db)
 *
 * @param walletAddress
 * @param userId
 * @param tokenBalances
 * @param transactions
 */
const aggregateTransactions = async (
  walletAddress: string,
  tokenBalances: {
    [key: string]: string;
  },
  transactions: ITransaction[]
): Promise<AggregatedTransactions> => {
  const aggTrx: AggregatedTransactions = {};

  const currentDate = new Date();
  let minDate = new Date(currentDate);
  const balanceChain: {
    [key: string]: {
      balance: number;
      balance_usd: number;
      price: number;
      in: boolean;
    }[];
  } = {};

  transactions
    .slice(0)
    .reverse()
    .forEach((tx: ITransaction) => {
      const trxDateTime = roundOffDate(currentDate, tx.timestamp);
      minDate = minDate < trxDateTime ? minDate : trxDateTime;

      if (!(trxDateTime.toISOString() in aggTrx)) {
        aggTrx[trxDateTime.toISOString()] = {
          dateTime: trxDateTime,
          platform_id: tx.platform_id,
          wallet_address: walletAddress,
          block: tx.additional_properties.block,
          hash: tx.additional_properties.transaction_hash,
          balances: Object.assign({}, tokenBalances),
          balances_usd: {},
        };
      }

      const fee = new BigNumber(tx.fee);

      if (!(tx.currency in tokenBalances)) tokenBalances[tx.currency] = "0";
      tokenBalances[tx.currency] = new BigNumber(tokenBalances[tx.currency])
        .plus(fee)
        .toString();

      if (!tx.success) {
        return;
      }

      tx.tokens.forEach((txToken: ITransactionTokenProps) => {
        const { token_id, value } = txToken;

        if (!(token_id in tokenBalances)) {
          tokenBalances[token_id] = "0";
        }

        if (!(txToken.token_id in balanceChain))
          balanceChain[txToken.token_id] = [];
        balanceChain[txToken.token_id].unshift({
          balance: Number(txToken.value),
          balance_usd: txToken.usd_value,
          price: txToken.usd_value / Number(txToken.value),
          in: txToken.in,
        });

        const newValue: BigNumber = txToken.in
          ? new BigNumber(-value)
          : new BigNumber(value);
        const updatedValue = new BigNumber(tokenBalances[token_id]).plus(
          newValue
        );
        tokenBalances[token_id] =
          updatedValue < new BigNumber(0) ? "0" : updatedValue.toString();
      });
    });

  return aggTrx;
};

const calculateUnrealizedProfits = (
  transactions: ITransaction[],
  tokenBalances?: {
    [key: string]: string;
  }
) => {
  const tokens: {
    [key: string]: {
      balance: number;
      balance_usd: number;
      price: number;
    }[];
  } = {};

  if (tokenBalances) {
    Object.keys(tokenBalances).forEach((key: string) => {
      if (Number(tokenBalances[key]) === 0) return;
      if (!(key in tokens)) tokens[key] = [];

      tokens[key].push({
        balance: Number(tokenBalances[key]),
        balance_usd: -1,
        price: -1,
      });
    });
  }

  const unRealizedProfit: {
    [key: string]: number;
  } = {};

  transactions.forEach((transaction: ITransaction) => {
    const { currency } = transaction;
    if (!(currency in unRealizedProfit)) unRealizedProfit[currency] = 0;
    unRealizedProfit[currency] -= currency in tokens ? transaction.fee_usd : 0;

    let feeLeft = Number(transaction.fee);
    while (Number(feeLeft.toFixed(10)) > 0) {
      const diff = tokens[currency][0].balance - feeLeft;
      if (diff <= 0) {
        feeLeft -= tokens[currency][0].balance;
        tokens[currency].splice(0, 1);
      } else {
        feeLeft = 0;
        tokens[currency][0].balance = diff;
        tokens[currency][0].balance_usd = tokens[currency][0].price * diff;
      }
    }

    transaction.tokens.forEach((token: ITransactionTokenProps) => {
      const { token_id } = token;
      if (!(token_id in tokens)) {
        tokens[token_id] = [];
      }

      if (token.in) {
        tokens[token_id].push({
          balance: Number(token.value),
          balance_usd: token.usd_value,
          price: token.usd_value / Number(token.value),
        });
        return;
      }

      let totalValue = 0;
      let left = Number(token.value);

      while (Number(left.toFixed(10)) > 0) {
        const tokenValue = tokens[token_id][0].balance;
        const balance = tokenValue - left;
        const tokenCurrentPrice = token.usd_value / Number(token.value);

        if (tokens[token_id][0].balance_usd < 0) {
          tokens[token_id][0].price = tokenCurrentPrice;
          tokens[token_id][0].balance_usd =
            tokens[token_id][0].balance * tokenCurrentPrice;
        }

        if (balance <= 0) {
          totalValue += tokens[token_id][0].balance_usd;
          left -= tokenValue;
          tokens[token_id].splice(0, 1);
        } else {
          const reducedValue = tokens[token_id][0].balance - balance;
          totalValue += tokens[token_id][0].price * reducedValue;
          tokens[token_id][0].balance_usd = tokens[token_id][0].price * balance;
          tokens[token_id][0].balance = balance;
          left = 0;
        }
      }

      if (!(token_id in unRealizedProfit)) unRealizedProfit[token_id] = 0;
      unRealizedProfit[token_id] += token.usd_value - totalValue;
    });
  });
};

const getAveragePrices = async (
  transactions: ITransaction[],
  isHistorical: boolean
) => {
  // const { platform_id, wallet_address } = transactions[0];
  // const tokenAveragePrice: IWalletMetadata = await WalletMetadata.findOne({
  //   platform_id: transactions[0].platform_id,
  //   wallet_address: transactions[0].wallet_address,
  // });

  // const tokenPrices: {
  //   [key: string]: {
  //     volume: number;
  //     average: number;
  //   };
  // } = !isHistorical && tokenAveragePrice ? tokenAveragePrice.average_price : {};

  // let moneyIn =
  //   !isHistorical && tokenAveragePrice && tokenAveragePrice.money_in
  //     ? tokenAveragePrice.money_in
  //     : {};
  // let moneyOut =
  //   !isHistorical && tokenAveragePrice && tokenAveragePrice.money_out
  //     ? tokenAveragePrice.money_out
  //     : {};

  // transactions.forEach((transaction: ITransaction) => {
  //   if (!transaction.method) transaction.method = "";

  //   const isSwapTransaction =
  //     ["buy", "trade", "sell"].includes(transaction.type) ||
  //     transaction.method.startsWith("swap") ||
  //     transaction.method.startsWith("exactInput") ||
  //     transaction.method.startsWith("multicall");
  //   if (isSwapTransaction && transaction.success) {
  //     const tokenIn = {
  //       token_id: null,
  //       value: 0,
  //       usd_value: 0,
  //     };
  //     const tokenOut = {
  //       token_id: null,
  //       value: 0,
  //       usd_value: 0,
  //     };

  //     transaction.tokens.forEach((token: ITransactionTokenProps) => {
  //       if (token.in) {
  //         tokenIn.usd_value += token.usd_value;
  //         tokenIn.value += Number(token.value);
  //         tokenIn.token_id = token.token_id;
  //       } else {
  //         tokenOut.usd_value += token.usd_value;
  //         tokenOut.value += Number(token.value);
  //         tokenOut.token_id = token.token_id;
  //       }
  //     });

  //     const { token_id } = tokenIn;

  //     // calculate money in and money out
  //     if (transaction.type === "buy") {
  //       if (!(token_id in moneyIn)) moneyIn[token_id] = 0;
  //       moneyIn[token_id] += transaction.tokens[0].usd_value;
  //     }

  //     if (transaction.type === "sell") {
  //       if (!(tokenOut.token_id in moneyOut)) moneyOut[tokenOut.token_id] = 0;
  //       moneyOut[tokenOut.token_id] += transaction.tokens[0].usd_value;
  //     }

  //     // calculate average price of token
  //     if (!token_id) return;

  //     if (!(token_id in tokenPrices))
  //       tokenPrices[token_id] = {
  //         volume: 0,
  //         average: 0,
  //       };

  //     const oldTotalPrice =
  //       tokenPrices[token_id].average * tokenPrices[token_id].volume;
  //     const totalValue = tokenPrices[token_id].volume + tokenIn.value;

  //     tokenPrices[token_id].average =
  //       (oldTotalPrice + tokenIn.usd_value) / totalValue;
  //     tokenPrices[token_id].volume = totalValue;
  //   }
  // });

  // await WalletMetadata.findOneAndUpdate(
  //   {
  //     platform_id,
  //     wallet_address,
  //   },
  //   { average_price: tokenPrices, money_in: moneyIn, money_out: moneyOut },
  //   { upsert: true, new: true, setDefaultsOnInsert: true }
  // );

  //return tokenPrices;
};

const processTransactions = async (
  startDate: Date,
  endDate: Date,
  diffDate: Date,
  transactions: ITransaction[],
  tokensList: string[],
  tokenBalances: {
    [key: string]: string;
  },
  isHistorical: boolean = true
) => {
  const walletAddress = transactions[0].wallet_address;

  const currentDate = new Date();
  const tokenSymbols = [
    ...new Set([...tokensList, ...Object.keys(tokenBalances)]),
  ];

  const { allDates, dateRangeByInterval } = getAllDatePoints(
    startDate,
    endDate,
    diffDate
  );
  dateRangeByInterval["LATEST"] = dateRangeByInterval["FORTYEIGHT"];

  const tokenPriceList = await getTokenPricesByInterval(
    dateRangeByInterval,
    tokenSymbols
  );
  console.log("Token prices fetched.");

  // fill missing data points in price data
  // for all symbols and all dates
  const lastPrice: {
    [key: string]: number;
  } = {};

  tokenSymbols.forEach((symbol) => {
    for (const date of Object.keys(tokenPriceList)) {
      if (tokenPriceList[date][symbol]) {
        lastPrice[symbol] = tokenPriceList[date][symbol];
        break;
      }
    }
  });

  allDates.forEach((date) => {
    if (!tokenPriceList[date.toISOString()])
      tokenPriceList[date.toISOString()] = {};

    tokenSymbols.forEach((symbol) => {
      if (tokenPriceList[date.toISOString()][symbol]) {
        lastPrice[symbol] = tokenPriceList[date.toISOString()][symbol];
      } else {
        tokenPriceList[date.toISOString()][symbol] = lastPrice[symbol] || 0;
      }
    });
  });

  // update usd values for tokens in all transactions
  transactions.map((transaction: ITransaction) => {
    const date = roundOffDate(currentDate, transaction.timestamp);
    transaction.tokens.map((token: ITransactionTokenProps) => {
      if (!token.usd_value) {
        const tokenUSDPrice = tokenPriceList[date.toISOString()]
          ? tokenPriceList[date.toISOString()][token.token_id] || 0
          : 0;
        token.usd_value = Number(token.value) * tokenUSDPrice;
      }

      return token;
    });

    return transaction;
  });

  const averagePrices = getAveragePrices(transactions, isHistorical);
  const aggregatedTransactions = aggregateTransactions(
    walletAddress,
    tokenBalances,
    transactions
  );
  const results = await Promise.all([averagePrices, aggregatedTransactions]);

  // const portfolioTransactions: IPortfolioTransaction[] = isHistorical
  //   ? await _processHistoricalDataPoints(results[1], allDates, tokenPriceList)
  //   : Object.values(results[1]);

  const portfolioTransactions: IPortfolioTransaction[] =
    await _processHistoricalDataPoints(results[1], allDates, tokenPriceList);

  return {
    transactions: transactions,
    portfolioTransactions,
  };
};

export default {
  aggregateBTCBalances,
  aggregateTransactions,
  calculateUnrealizedProfits,
  getTokenPricesByInterval,
  roundOffDate,
  getPreviousPoint,
  getDateRange,
  getAllDatePoints,
  getAveragePrices,
  processTransactions,
  writeToDB,
};
