import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
};

export default config;