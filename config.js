import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  id: Number(process.env.TELEGRAM_CHAT_ID),
  defaultPath: process.env.DOWNLOAD_DEFAULT_PATH ?? '/downloads',
  audioPath: process.env.DOWNLOAD_AUDIO_PATH ?? '/downloads/audio',
  documentPath: process.env.DOWNLOAD_DOCUMENT_PATH ?? '/downloads/documents',
  photoPath: process.env.DOWNLOAD_PHOTO_PATH ?? '/downloads/photos',
  torrentPath: process.env.DOWNLOAD_TORRENT_PATH ?? '/downloads/torrents',
};

export default config;