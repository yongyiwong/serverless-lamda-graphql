export interface IWalletMetadata {
  /** blockchain platform id based on CoinMarketCap */
  platform_id: number;
  /** wallet account address */
  wallet_address: string;
  money_in?: {
    [key: string]: number;
  };
  money_out?: {
    [key: string]: number;
  };
  average_price?: {
    [key: string]: {
      volume: number;
      average: number;
    };
  };
}
