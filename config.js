import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  id: Number(process.env.TELEGRAM_CHAT_ID),
  defaultPath: process.env.DOWNLOAD_DEFAULT_PATH ?? '/downloads',
};

export default config;