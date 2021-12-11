export interface IPortfolioTransaction {
  /** date time of aggregation */
  dateTime: Date;
  /** blockchain platform id based on CoinMarketCap */
  platform_id: number;
  /** wallet address */
  wallet_address: string;
  /** object containing all token balances */
  balances: {
    [key: string]: string;
  };
  /** object containing all token balances in USD */
  balances_usd: {
    [key: string]: number;
  };
  hash?: string;
  block?: number;
}
