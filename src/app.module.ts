import { Module } from '@nestjs/common';
import { WalletModule } from './wallet/wallet.module';
import { DbModule } from './db/db.module';
import { AgentModule } from './agent/agent.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenAuthGuard } from './auth/at-auth.guard';

@Module({
  imports: [DbModule, AgentModule, TelegramBotModule, AuthModule, WalletModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenAuthGuard,
    },
  ],
})
export class AppModule {}
