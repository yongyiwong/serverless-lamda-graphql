export interface ITransactionTokenProps {
  /** sender/receiver address */
  address?: string;
  /** token id */
  token_id: string;
  /** tick symbol of the token */
  symbol?: string;
  /** name of the token */
  token_name?: string;
  /** transaction value */
  value: string;
  /** transaction usd value */
  usd_value?: number;
  /** stores if transfer is in/out */
  in: boolean;
}

export interface ITransactionAdditionalProps {
  /** transaction block number */
  block: number;
  /** transaction offset */
  offset?: number;
  /** transaction hash */
  transaction_hash: string;
  /** transaction inputs */
  inputs?: any[];
  /** transaction outputs */
  outputs?: any[];
}

export interface ITransaction {
  /** blockchain platform id based on CoinMarketCap */
  platform_id: number;
  /** block signed timestamp */
  timestamp: Date;
  /** wallet address */
  wallet_address: string;
  /** type of the transaction - normal | token | internal */
  type: "trade" | "swap" | "buy" | "sell";
  /** transaction method if normal transaction */
  method?: string;
  /** transaction fee */
  fee: string;
  /** transaction fee usd */
  fee_usd: number;
  /** transaction base currency */
  currency: string;
  /** from address */
  from?: string;
  /** to address */
  to?: string;
  /** transaction status */
  success?: boolean;
  /** token one properties */
  tokens: ITransactionTokenProps[];
  /** additional transaction properties */
  additional_properties?: ITransactionAdditionalProps | any;
}
