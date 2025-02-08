import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AgentModule } from './agent/agent.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenAuthGuard } from './auth/at-auth.guard';

@Module({
  imports: [DbModule, AgentModule, TelegramBotModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenAuthGuard,
    },
  ],
})
export class AppModule {}
