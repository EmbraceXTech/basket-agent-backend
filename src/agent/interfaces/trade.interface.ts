import { BuyDto } from "../wallet/dto/buy.dto";
import { SellDto } from "../wallet/dto/sell.dto";


export type TradeStep = {
    type: 'buy';
    data: BuyDto;
    reason: string;
} | {
    type: 'sell';
    data: SellDto;
    reason: string;
}

export type TradePlan = {
    steps: TradeStep[];
}

export type AgentTradePlan = {
    thoughts: string;
    tradeSteps: TradeStep[];
}