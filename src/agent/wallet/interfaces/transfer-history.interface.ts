export interface TransferHistory {
    toAddress: string;
    tokenAddress: string;
    amount: string | null;
    value: string | null;
    timestamp: number;
}