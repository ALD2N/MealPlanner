import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dndmeal',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
