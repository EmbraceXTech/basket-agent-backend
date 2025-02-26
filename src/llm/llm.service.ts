import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

import { config } from 'src/config';
import { AgentTradePlan } from 'src/agent/interfaces/trade.interface';
import {
  tradePlanSystemPrompt,
  tradePlanUserMessage,
} from './constants/promptTempalte.constant';
import { ChainService } from 'src/chain/chain.service';
import { WalletService } from 'src/agent/wallet/wallet.service';
import { PriceService } from 'src/price/price.service';
import { Token } from 'src/agent/interfaces/token.interface';
import { AgentService } from 'src/agent/agent.service';
import { ChainInfo } from 'src/chain/interfaces/chain-info.interface';
import { PriceResponse } from 'src/price/interfaces/price-response.interface';
import {
  reTradePlanSystemPrompt,
  reTradePlanUserMessage,
} from './constants/re-create-promptTempalte.constant';

@Injectable()
export class LlmService {
  private model: ChatOpenAI;
  constructor(
    private readonly chainService: ChainService,
    private readonly walletService: WalletService,
    private readonly priceService: PriceService,
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
  ) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      apiKey: config.openaiApiKey,
    });
  }

  async _fetchTradeInfo(agentId: string) {
    const agent = await this.agentService.findOne(agentId);
    const _tokensSelected = agent.selectedTokens.map(
      (token) => JSON.parse(token) as Token,
    );
    // TODO: confirm use tokens or tokenValues
    const promiseArray: [
      Promise<{
        equity: number;
        performance: number;
        tokens: (string | number)[][];
        tokenValues: (string | number)[][];
        balance: number;
      }>,
      Promise<ChainInfo>,
      Promise<PriceResponse[]>,
    ] = [
      this.walletService.getBalance(agentId),
      this.chainService.getChainInfo(parseInt(agent.chainId)),
      this.priceService.getPrices(
        _tokensSelected.map((token) => token.tokenSymbol.toUpperCase()),
        agent.chainId,
      ),
    ];
    const [balance, chainInfo, tokenPrices] = await Promise.all(promiseArray);
    const tokensSelected = _tokensSelected.map((token) => ({
      ...token,
      price: tokenPrices.find(
        (price) =>
          price.token.toUpperCase() === token.tokenSymbol.toUpperCase(),
      )?.price,
    }));
    const tokensTradeAmount = balance.tokens.map(([token, amount]) => ({
      tokenSymbol: token,
      amount,
      price: tokensSelected.find((t) => t.tokenSymbol === token)?.price,
    }));
    const usdcTokenFound = tokensTradeAmount.find(
      (t) => t.tokenSymbol.toString().toUpperCase() === 'USDC',
    );
    if (!usdcTokenFound) {
      tokensTradeAmount.push({
        tokenSymbol: 'USDC',
        amount: 0,
        price: 1,
      });
    }
    const usdcBalance = usdcTokenFound?.amount || 0;
    return {
      strategyDescription: agent.strategy,
      knowledges: agent.knowledge.map((knowledge) => ({
        topic: knowledge.name,
        insight: knowledge.content,
      })),
      tokensSelected,
      chainInfo,
      tokensTradeAmount,
      usdcBalance,
    };
  }

  async createTradePlan(agentId: string, tempStrategyDescription?: string) {
    const {
      strategyDescription,
      knowledges,
      chainInfo,
      tokensSelected,
      tokensTradeAmount,
      usdcBalance,
    } = await this._fetchTradeInfo(agentId);

    const strategyDescriptionPrompt =
      tempStrategyDescription || strategyDescription;

    const parser = new JsonOutputParser<AgentTradePlan>();
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', tradePlanSystemPrompt],
      ['user', tradePlanUserMessage],
    ]);

    const chain = promptTemplate.pipe(this.model).pipe(parser);

    const result = await chain.invoke({
      strategyDescription: strategyDescriptionPrompt,
      knowledges: JSON.stringify(knowledges, null, 2),
      tokensSelected: JSON.stringify(tokensSelected, null, 2),
      tokensTradeAmount: JSON.stringify(tokensTradeAmount, null, 2),
      usdcBalance,
      chain: chainInfo.name,
      chainId: chainInfo.chainId,
    });
    return result;
  }

  async reCreateTradePlan(agentId: string, error: any) {
    const {
      strategyDescription,
      knowledges,
      chainInfo,
      tokensSelected,
      tokensTradeAmount,
      usdcBalance,
    } = await this._fetchTradeInfo(agentId);
    const parser = new JsonOutputParser<AgentTradePlan>();
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', reTradePlanSystemPrompt],
      ['user', reTradePlanUserMessage],
    ]);

    const chain = promptTemplate.pipe(this.model).pipe(parser);

    const result = await chain.invoke({
      strategyDescription,
      knowledges: JSON.stringify(knowledges, null, 2),
      tokensSelected: JSON.stringify(tokensSelected, null, 2),
      tokensTradeAmount: JSON.stringify(tokensTradeAmount, null, 2),
      usdcBalance,
      chain: chainInfo.name,
      chainId: chainInfo.chainId,
      error: JSON.stringify(error, null, 2),
    });
    return result;
  }
}
