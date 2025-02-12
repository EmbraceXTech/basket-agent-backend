import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WalletModule } from './wallet/wallet.module';
import { PriceModule } from 'src/price/price.module';

@Module({
  imports: [WalletModule, PriceModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
