export interface BalanceSnapshotInput {
    balance: number,
    injection: number,
    date?: Date,
    transactionHash?: string,
}

export interface LineData {
    title: string;
    times: Date[];
    values: number[];
  }
  
export interface ChartPoint {
  date: string;
  [key: string]: number | string;
}
