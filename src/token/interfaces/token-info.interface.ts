export interface TokenInfoMap {
    [key: string]: TokenInfo;
}

export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
}
