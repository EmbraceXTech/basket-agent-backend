import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
};
