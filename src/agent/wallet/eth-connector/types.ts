export type EthereumBalanceParams = {
    token?: string;
    walletAddress: string;
  };
  
  export type EthereumBalanceResult = {
    token?: string;
    walletAddress: string;
    amount: number;
  };
  
  export type TokenExtention = {
    bridgeInfo?: {
      [key: string]: {
        tokenAddress?: string;
      };
    };
  };
  
  export type Token = {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: 18;
    logoURI: string;
    extensions?: TokenExtention;
  };
  