import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AgentModule } from './agent/agent.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenAuthGuard } from './auth/at-auth.guard';
import { PriceModule } from './price/price.module';
import { ChainModule } from './chain/chain.module';
import { TokenModule } from './token/token.module';
import { BullModule } from '@nestjs/bullmq';
import { config } from './config';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    DbModule,
    AgentModule,
    TelegramBotModule,
    AuthModule,
    PriceModule,
    ChainModule,
    TokenModule,
    LlmModule,
    BullModule.forRoot({
      connection: {
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenAuthGuard,
    },
  ],
})
export class AppModule {}
