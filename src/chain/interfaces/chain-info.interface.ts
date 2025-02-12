export interface ChainInfo {
  name: string;
  chain: string;
  rpc: string[];
  faucets: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  infoURL: string;
  shortName: string;
  chainId: number;
  networkId: number;
  icon?: string;
  explorers?: {
    name: string;
    url: string;
    icon?: string;
    standard?: string;
  }[];
  status?: string;

  iconUrl?: string;
}

