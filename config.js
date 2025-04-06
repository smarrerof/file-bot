import dotenv from 'dotenv';

// Default download paths
const downloadsPath = '/downloads';

// Load environment variables
dotenv.config();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  id: Number(process.env.TELEGRAM_CHAT_ID),
  defaultPath: process.env.DOWNLOAD_DEFAULT_PATH ?? downloadsPath,
  audioPath: process.env.DOWNLOAD_AUDIO_PATH ?? downloadsPath,
  documentPath: process.env.DOWNLOAD_DOCUMENT_PATH ?? downloadsPath,
  photoPath: process.env.DOWNLOAD_PHOTO_PATH ?? downloadsPath,
  torrentPath: process.env.DOWNLOAD_TORRENT_PATH ?? downloadsPath,
  videoPath: process.env.DOWNLOAD_VIDEO_PATH ?? downloadsPath,
};

export default config;