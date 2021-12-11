export interface IWallet {
  /** user id */
  user_id: string;
  /** wallet account address */
  address: string;
  /** type - wallet / exchange */
  integration_type: string;
  /** blockchain platform id based on CoinMarketCap */
  platform_id: number;
  /** wallet name */
  name?: string;
  /** import status */
  import_status: "pending" | "importing" | "success" | "failed";
  /** all transactions import status */
  all_transactions_status: "pending" | "importing" | "success" | "failed";
  key: string;
  secret: string;
  pass_phrase: string;
  access_token: string;
  refresh_token: string;
  token_valid: Date;
}

export interface IWalletStatus {
  import_status?: "pending" | "importing" | "success" | "failed";
  all_transactions_status?: "pending" | "importing" | "success" | "failed";
}
