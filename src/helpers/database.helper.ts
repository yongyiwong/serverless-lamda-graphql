// Model imports
// import TokenBalance from "../models/token_balance.model";
// import Transaction from "../models/transaction.model";

// interfaces
import { ITokenBalance } from "../interfaces/models/token";
import { ITransaction } from "../interfaces/models/transaction";

/**
 * Function to write transactions to mongoDB
 *
 * @param transactions list of transactions
 */
const writeTransactionsToDB = async (
  transactions: ITransaction[]
): Promise<void> => {
  // await Transaction.bulkWrite(
  //   transactions.map((tx: ITransaction) => ({
  //     updateOne: {
  //       filter: {
  //         platform_id: tx.platform_id,
  //         wallet_address: tx.wallet_address,
  //         "additional_properties.transaction_hash":
  //           tx.additional_properties.transaction_hash,
  //       },
  //       update: {
  //         $set: tx,
  //       },
  //       upsert: true,
  //     },
  //   }))
  // );
};

/**
 * Function to write token balances to mongoDB
 *
 * @param tokenBalances list of token balances
 */
const writeBalancesToDB = async (
  tokenBalances: ITokenBalance[]
): Promise<void> => {
  // await TokenBalance.bulkWrite(
  //   tokenBalances.map((token: ITokenBalance) => ({
  //     updateOne: {
  //       filter: {
  //         platform_id: token.platform_id,
  //         token_id: token.token_id,
  //         wallet_address: token.wallet_address,
  //       },
  //       update: {
  //         $set: token,
  //       },
  //       upsert: true,
  //     },
  //   }))
  // );
};

export default {
  writeBalancesToDB,
  writeTransactionsToDB,
};
