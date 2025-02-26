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
  binanceApiEndpoint:
    process.env.BINANCE_API_ENDPOINT || 'https://api.binance.com',
  oneinchApiEndpoint:
    process.env.ONEINCH_API_ENDPOINT || 'https://api.1inch.dev',
  oneinchApiKey: process.env.ONEINCH_API_KEY || '',
  chainIconTemplateUrl: process.env.CHAIN_ICON_TEMPLATE_URL || '',
  availableChainIds: (process.env.AVAILABLE_CHAIN_IDS || '').split(','),
  availableTokens: (process.env.AVAILABLE_TOKENS || '').split(','),
  defaultChainId: process.env.DEFAULT_CHAIN_ID || '8453',
  redisHost: process.env.REDIS_HOST || '',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  redisPassword: process.env.REDIS_PASSWORD || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  baseRpcUrl: process.env.BASE_RPC_URL || '',
  paraApiKey: process.env.PARA_API_KEY || '',
};
