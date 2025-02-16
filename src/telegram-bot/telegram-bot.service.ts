import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot } from 'grammy';
import { AuthService } from 'src/auth/auth.service';
import { config } from 'src/config';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private bot: Bot;

  constructor(private authService: AuthService) {
    this.bot = new Bot(config.telegramBotToken);
  }

  async onModuleInit() {
    this.bot.command('start', async (ctx) => {
      const user = ctx.from;

      const accessToken = await this.authService.loginWithTelegram(
        user.id.toString(),
      );

      const url = `https://basket-agent-mini-app.vercel.app/?accessToken=${accessToken}`;

      console.log({ url });

      await ctx.reply('Welcome to Basket Agent!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Basket Agent App',
                web_app: {
                  url,
                },
              },
            ],
          ],
        },
      });
    });

    this.bot.start().catch((err) => {
      console.error(err);
    });
  }
}
