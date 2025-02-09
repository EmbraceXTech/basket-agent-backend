import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { privyWalletProvider } from './wallet.provider';

@Module({
  providers: [WalletService, privyWalletProvider],
  exports: [WalletService],
})
export class WalletModule {}
