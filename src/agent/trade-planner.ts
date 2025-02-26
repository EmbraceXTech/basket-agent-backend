import { BadRequestException } from '@nestjs/common';
import { TradePlan, TradeStep } from './interfaces/trade.interface';
import { Coinbase, Trade } from '@coinbase/coinbase-sdk';
import * as schema from 'src/db/schema';
import { WalletService } from './wallet/wallet.service';
import { BuyDto } from './wallet/dto/buy.dto';
import { SellDto } from './wallet/dto/sell.dto';
import { TradePlanDto } from './dto/trade.dto';
import { LlmService } from 'src/llm/llm.service';

export class TradePlanner {
  constructor(
    private readonly walletService: WalletService,
    private readonly llmService: LlmService,
  ) {}

  async createTradingPlan(
    agent: typeof schema.agentsTable.$inferSelect,
  ): Promise<TradePlan | null> {
    try {
      // const { id, strategy, selectedTokens, chainId } = agent;
      // const currentHoldings = await this.walletService.getBalance(
      //   id.toString(),
      // );
      // const balanceMap = new Map(
      //   currentHoldings.tokens.map(([token, balance]) => [
      //     token as string,
      //     balance as number,
      //   ]),
      // );

      // // TODO: Move to chain config
      // const minGas = 0.001;
      // // TODO: Replace this with AI agent call - use strategy, knowledge to plan trading
      // let spentUSD = 0;
      // const tradeSteps: TradeStep[] = [];
      // for (const token of selectedTokens) {
      //   const remainingStablecoin =
      //     balanceMap.get(Coinbase.assets.Usdc) || 0 - spentUSD;
      //   const { tokenSymbol, tokenAddress } = JSON.parse(token);
      //   const remainingToken = balanceMap.get(tokenSymbol) || 0;

      //   const randValue = Math.floor(Math.random() * 3) % 3;

      //   if (randValue === 0) {
      //     const action = 'buy';
      //     const maxAvailableAmount = remainingStablecoin;
      //     const amount = Math.random() * maxAvailableAmount;
      //     spentUSD += amount;

      //     if (amount > 0) {
      //       tradeSteps.push({
      //         type: action,
      //         data: {
      //           tokenAddress,
      //           usdAmount: amount,
      //         },
      //         reason: 'Buy random amount of token',
      //       });
      //     } else {
      //       tradeSteps.push({
      //         type: 'hold',
      //         data: null,
      //         reason: 'No amount to buy',
      //       });
      //     }
      //   } else if (randValue === 1) {
      //     const action = 'sell';
      //     const maxAvailableAmount = Math.max(0, remainingToken - minGas);
      //     const amount = Math.random() * maxAvailableAmount;

      //     if (amount > 0) {
      //       tradeSteps.push({
      //         type: action,
      //         data: {
      //           tokenAddress,
      //           tokenAmount: amount,
      //         },
      //         reason: 'Sell random amount of token',
      //       });
      //     } else {
      //       tradeSteps.push({
      //         type: 'hold',
      //         data: null,
      //         reason: 'No amount to sell',
      //       });
      //     }
      //   } else {
      //     tradeSteps.push({
      //       type: 'hold',
      //       data: null,
      //       reason: 'No action',
      //     });
      //   }
      // }
      const { thoughts, tradeSteps } = await this.llmService.createTradePlan(
        agent.id.toString(),
      );

      return {
        steps: tradeSteps,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to plan trading: ${error.message}`);
    }
  }

  async executeTradingPlan(id: string, plan: TradePlanDto) {
    try {
      const result: (Trade | null)[] = [];
      for (const step of plan.steps) {
        const { type, data } = step;
        if (type === 'hold') {
          result.push(null);
        } else if (type === 'buy') {
          const trade = await this.walletService.buyAsset(id, data as BuyDto);
          result.push(trade);
        } else if (type === 'sell') {
          const trade = await this.walletService.sellAsset(id, data as SellDto);
          result.push(trade);
        }
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
}
