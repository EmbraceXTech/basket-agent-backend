import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { privyWalletProvider } from './wallet.provider';
import { PriceModule } from 'src/price/price.module';

@Module({
  providers: [WalletService, privyWalletProvider],
  exports: [WalletService],
  imports: [PriceModule]
})
export class WalletModule {}
