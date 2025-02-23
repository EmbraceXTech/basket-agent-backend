import { BuyDto } from "../wallet/dto/buy.dto";
import { SellDto } from "../wallet/dto/sell.dto";

export type TradePlan = {
    steps: TradeStep[];
}

export type TradeStep = {
    type: 'buy';
    data: BuyDto;
    reason: string;
} | {
    type: 'sell';
    data: SellDto;
    reason: string;
} | {
    type: 'hold';
    data: null;
    reason: string;
}