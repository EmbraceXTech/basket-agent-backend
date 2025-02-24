import { Inject, Injectable } from '@nestjs/common';
import { OpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import * as schema from 'src/db/schema';
import { config } from 'src/config';
import { TradeStep } from 'src/agent/interfaces/trade.interface';
import {
  tradePlanSystemPrompt,
  tradePlanUserMessage,
} from './constants/promptTempalte.constant';

@Injectable()
export class LlmService {
  private model: OpenAI;
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.model = new OpenAI({
      modelName: 'gpt-3.5-turbo',
      apiKey: config.openaiApiKey,
    });
  }

  async generateTradePlan() {
    const strategyDescription =
      'Market is bullish with strong momentum on BTC and ETH.';
    const knowledges = [
      { topic: 'BTC', insight: 'High trading volume detected.' },
    ];
    const tokensSelected = [
      { tokenSymbol: 'BTC', tokenAddress: '0xbtc', price: 10000 },
      { tokenSymbol: 'ETH', tokenAddress: '0xeth', price: 2000 },
    ];
    const tokensTradeAmount = [
      { tokenSymbol: 'USDC', amount: 1000, price: 1 },
      { tokenSymbol: 'BTC', amount: 0.5, price: 10000 },
    ];
    const usdcBalance =
      tokensTradeAmount.find((t) => t.tokenSymbol === 'USDC')?.amount || 0;
    const parser = new JsonOutputParser<Array<TradeStep>>();
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', tradePlanSystemPrompt],
      ['user', tradePlanUserMessage],
    ]);

    const chain = promptTemplate.pipe(this.model).pipe(parser);

    const result = await chain.invoke({
      strategyDescription,
      knowledges: JSON.stringify(knowledges, null, 2),
      tokensSelected: JSON.stringify(tokensSelected, null, 2),
      tokensTradeAmount: JSON.stringify(tokensTradeAmount, null, 2),
      usdcBalance,
    });
    return result;
  }
}
