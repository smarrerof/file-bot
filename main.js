import axios from 'axios';
import fs from 'fs';
import path from 'path';


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
  if (ctx.message.from.id !== config.id) {
    console.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  if (ctx.message.document) {
    const document = ctx.message.document;

    const fileId = document.file_id;
    const filePath = path.resolve(config.defaultPath, document.file_name);
    const url = await ctx.telegram.getFileLink(fileId);

    downloadFile(url.href, filePath)
      .then(() => {
        const message = `🟢 ${document.file_name} downloaded successfully`;
        ctx.reply(message);
        console.log(message);
      })
      .catch(err => {
        const message = `🔴 Error downloading the document ${document.file_name}`;
        ctx.reply(message);
        console.error(message);
        console.error(err);
      });
  } else if (ctx.message.photo) {
    const photo = ctx.message.photo.pop();

    const fileId = photo.file_id;
    const filePath = path.resolve(config.defaultPath, `${photo.file_id}.jpeg`);
    const url = await ctx.telegram.getFileLink(fileId);

    downloadFile(url.href, filePath)
      .then(() => console.log('Photo downloaded successfully'))
      .catch(err => console.error('Error downloading photo:', err));
  } else if (ctx.message.text) {
    // Detect if the message is an URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(ctx.message.text)) {
      // Download the file from the URL
      const url = ctx.message.text;
      const fileName = url.split('/').pop();
      const filePath = path.resolve(config.defaultPath, fileName);

      downloadFile(url, filePath)
        .then(() => {
          const message = `🟢 ${fileName} downloaded successfully`;
          ctx.reply(message);
          console.log(message);
        })
        .catch(err => {
          const message = `🔴 Error downloading from ${url}`;
          ctx.reply(message);
          console.error(message);
          console.error(err);
        });
    }
  } else {    
    const message = `🟠 Message is unknown at the moment`;
    ctx.reply(message);
    console.warning(message);
  }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))