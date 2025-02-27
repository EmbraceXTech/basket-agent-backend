import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PriceModule } from 'src/price/price.module';
import { WalletController } from './wallet.controller';
import { TokenModule } from 'src/token/token.module';
import { AgentModule } from '../agent.module';
import { ChainModule } from 'src/chain/chain.module';

@Module({
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
  imports: [
    PriceModule,
    TokenModule,
    ChainModule,
    forwardRef(() => AgentModule),
  ],
})
export class WalletModule {}
