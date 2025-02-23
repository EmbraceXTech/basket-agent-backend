import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { privyWalletProvider } from './wallet.provider';
import { PriceModule } from 'src/price/price.module';
import { WalletController } from './wallet.controller';

@Module({
  providers: [WalletService, privyWalletProvider],
  exports: [WalletService],
  imports: [PriceModule],
  controllers: [WalletController]
})
export class WalletModule {}
