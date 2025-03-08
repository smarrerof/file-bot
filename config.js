import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  id: Number(process.env.TELEGRAM_CHAT_ID),
};

export default config;