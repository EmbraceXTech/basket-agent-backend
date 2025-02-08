import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AgentModule } from './agent/agent.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';

@Module({
  imports: [DbModule, AgentModule, TelegramBotModule],
})
export class AppModule {}
