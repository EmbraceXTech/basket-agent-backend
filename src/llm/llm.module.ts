import { forwardRef, Module } from '@nestjs/common';

import { LlmService } from './llm.service';
import { ChainModule } from 'src/chain/chain.module';
import { WalletModule } from 'src/agent/wallet/wallet.module';
import { PriceModule } from 'src/price/price.module';
import { AgentModule } from 'src/agent/agent.module';

@Module({
  imports: [
    ChainModule,
    WalletModule,
    PriceModule,
    forwardRef(() => AgentModule),
  ],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
