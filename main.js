import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf'

// Custom imports
import config from './config.js';

// Check if config variables are defined
if (!config.token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined.');
}

if (!config.id) {
  throw new Error('TELEGRAM_CHAT_ID is not defined.');
}

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a bot using the token
const bot = new Telegraf(config.token);

/**
 * Downloads a file from the given URL and saves it to the specified file path.
 *
 * @param {string} url - The URL of the file to download.
 * @param {string} filePath - The local file path where the downloaded file will be saved.
 * @returns {Promise<void>} A promise that resolves when the file has been successfully downloaded and saved.
 * @throws {Error} If there is an error during the download or file writing process.
 */
async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Listen for messages
bot.on('message', async (ctx) => {
  console.log(ctx.message.from.id, config.id);
  if (ctx.message.from.id !== config.id) {
    console.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  if (ctx.message.document) {
    // console.log('document:', ctx.message.document);

    const document = ctx.message.document;

    const fileId = document.file_id;
    console.log('fileId:', fileId);

    const filePath = path.resolve(__dirname, 'downloads', document.file_name);
    console.log('filePath:', filePath);

    const url = await ctx.telegram.getFileLink(fileId);
    console.log('url:', url);

    downloadFile(url.href, filePath)
      .then(() => console.log('Document downloaded successfully'))
      .catch(err => console.error('Error downloading document:', err));
  } else if (ctx.message.photo) {
    // console.log('photo:', ctx.message.photo);

    const photo = ctx.message.photo.pop();
    console.log('photo:', photo);

    const fileId = photo.file_id;
    console.log('fileId:', fileId);

    const filePath = path.resolve(__dirname, 'downloads', `${photo.file_id}.jpeg`);
    console.log('filePath:', filePath);

    const url = await ctx.telegram.getFileLink(fileId);
    console.log('url:', url);

    downloadFile(url.href, filePath)
      .then(() => console.log('Document downloaded successfully'))
      .catch(err => console.error('Error downloading document:', err));
  } else if (ctx.message.text) {
    console.log('text:', ctx.message.text)
  } else {    
    console.log('Message is unknown at the moment: ', ctx);
  }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))