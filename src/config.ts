import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  authSecret: process.env.AUTH_SECRET || '',
  privyAppId: process.env.PRIVY_APP_ID || '',
  privyAppSecret: process.env.PRIVY_APP_SECRET || '',
  cdpApiKeyName: process.env.CDP_API_KEY_NAME || '',
  cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY || '',
  cdpSkEncryptionKey: process.env.CDP_SK_ENCRYPTION_KEY || '',
};
