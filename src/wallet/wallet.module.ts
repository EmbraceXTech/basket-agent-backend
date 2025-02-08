import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { privyWalletProvider } from './wallet.provider';

@Module({
  controllers: [WalletController],
  providers: [WalletService, privyWalletProvider],
  exports: [WalletService],
})
export class WalletModule {}
