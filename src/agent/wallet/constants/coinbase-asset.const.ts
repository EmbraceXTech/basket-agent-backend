import { Coinbase } from "@coinbase/coinbase-sdk";

export type CoinbaseAssetInfo = {
    chainId: number;
    chainIdHex: string;
    coinbaseAssetId: string;
    tokenAddress: string;
    decimals: number;
}

export const COINBASE_ASSETS = [
    {
        chainId: 84532, // Base Sepolia
        chainIdHex: '0x14a34',
        coinbaseAssetId: Coinbase.assets.Usdc,
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
    },
    {
        chainId: 84532, // Base Sepolia
        chainIdHex: '0x14a34',
        coinbaseAssetId: Coinbase.assets.Eth,
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        decimals: 18,
    },
    {
        chainId: 8453, // Base
        chainIdHex: '0x2105',
        coinbaseAssetId: Coinbase.assets.Usdc,
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
    },
    {
        chainId: 8453, // Base
        chainIdHex: '0x2105',
        coinbaseAssetId: Coinbase.assets.Eth,
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        decimals: 18,
    },
]

export const COINBASE_ASSET_MAP = COINBASE_ASSETS.reduce((acc, asset) => {
    if (acc[asset.chainIdHex] === undefined) {
        acc[asset.chainIdHex] = {};
    }
    if (acc[asset.chainId] === undefined) {
        acc[asset.chainId] = {};
    }
    if (acc[asset.chainIdHex][asset.tokenAddress.toLowerCase()] === undefined) {
        acc[asset.chainIdHex][asset.tokenAddress.toLowerCase()] = asset;
    }
    if (acc[asset.chainId][asset.tokenAddress.toLowerCase()] === undefined) {
        acc[asset.chainId][asset.tokenAddress.toLowerCase()] = asset;
    }
    return acc;
}, {} as Record<string, Record<string, CoinbaseAssetInfo>>);

export const USDC_ASSET_MAP = COINBASE_ASSETS.filter(asset => asset.coinbaseAssetId === Coinbase.assets.Usdc).reduce((acc, asset) => {
    if (acc[asset.chainIdHex] === undefined) {
        acc[asset.chainIdHex] = asset;
    }
    if (acc[asset.chainId] === undefined) {
        acc[asset.chainId] = asset;
    }
    return acc;
}, {} as Record<string, CoinbaseAssetInfo>);
