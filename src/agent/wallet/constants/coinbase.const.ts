import { Coinbase } from "@coinbase/coinbase-sdk";

export type CoinbaseChainInfo = {
    id: string;
    chainId: number;
    chainIdHex: string;
}

export const COINBASE_CHAINS = [
    {
        id: Coinbase.networks.BaseSepolia,
        chainId: 84532,
        chainIdHex: '0x14a34',
    },
    {
        id: Coinbase.networks.BaseMainnet,
        chainId: 8453,
        chainIdHex: '0x2105',
    },
]

export const COINBASE_CHAIN_ID_HEX_MAP = COINBASE_CHAINS.reduce((acc, chain) => {
    acc[chain.chainIdHex] = chain;
    return acc;
}, {} as Record<string, CoinbaseChainInfo>);

export const DEFAULT_CHAIN_ID = COINBASE_CHAINS[1] // Default as mainnet