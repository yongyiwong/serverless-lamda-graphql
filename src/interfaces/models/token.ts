export interface ITokenBalance {
  /** blockchain platform id based on CoinMarketCap */
  platform_id: number;
  /** name of the token */
  name: string;
  /** token ticker symbol */
  token_id: string;
  /** token contract address */
  token_address?: string;
  /** wallet address */
  wallet_address: string;
  /** token balance value */
  balance: string;
  /** external id */
  external_id?: string;
}
