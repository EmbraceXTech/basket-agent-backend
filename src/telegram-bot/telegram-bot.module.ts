import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
