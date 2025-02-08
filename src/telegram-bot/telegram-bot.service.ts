import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot } from 'grammy';
import { config } from 'src/config';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private bot: Bot;

  constructor() {
    this.bot = new Bot(config.telegramBotToken);
  }

  async onModuleInit() {
    this.bot.command('start', async (ctx) => {
      const user = ctx.from;
      console.log({ user });
      await ctx.reply('Welcome to Basket Agent!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Basket Agent App',
                web_app: { url: 'https://basket-agent-mini-app.vercel.app' },
              },
            ],
          ],
        },
      });
    });

    try {
      await this.bot.start();
    } catch (error) {
      console.error('telegram bot failed to start', error);
    }
  }
}
