import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { privyWalletProvider } from './wallet.provider';
import { PriceModule } from 'src/price/price.module';
import { WalletController } from './wallet.controller';
import { TokenModule } from 'src/token/token.module';
import { AgentModule } from '../agent.module';

@Module({
  providers: [WalletService, privyWalletProvider],
  controllers: [WalletController],
  exports: [WalletService],
  imports: [PriceModule, TokenModule, forwardRef(() => AgentModule)],
})
export class WalletModule {}
