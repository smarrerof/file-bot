import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

// Custom imports
import config from './config.js';
import log from './log.js';

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

  const fileName = path.basename(filePath);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      const message = `${fileName} downloaded successfully`;
      bot.telegram.sendMessage(config.id, `🟢 ${message}`)
      log.success(message);

      resolve();
    });
    writer.on('error', () => {
      const message = `Error downloading ${fileName}`;
      bot.telegram.sendMessage(`🔴 ${message}`);
      log.error(message);
      log.error(err);

      reject();
    });
  });
}

function getFileId(message) {
  if (message.document) {
    const document = message.document;
    return document.file_id;
  } else if (message.photo) {
    const photo = message.photo.pop();
    return photo.file_id;
  }
}

function getFileName(message) {
  const photoExtensions = ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.tiff', '.webp'];

  if (message.document) {
    const document = message.document;
    const fileName = document.file_name;
    
    return fileName;
  } else if (message.photo) {
    const photo = message.photo.pop();
    const fileName = `${photo.file_unique_id}.jpeg`
    
    return fileName;
  }
}

function getFilePath(fileName, type) {
  const documentExtensions = ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.txt', '.xls', '.xlsx'];
  const photoExtensions = ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.tiff', '.webp'];
  const torrentExtensions = ['.torrent'];

  if (type === 'document' || type === 'text') {
    const fileExtension = path.extname(fileName);

    let filePath = config.defaultPath;
    if (documentExtensions.includes(fileExtension)) {
      filePath = config.documentPath;
    } else if (photoExtensions.includes(fileExtension)) {
      filePath = config.photoPath;
    } else if (torrentExtensions.includes(fileExtension)) {
      filePath = config.torrentPath;
    }

    return path.resolve(filePath, fileName);
  } else if (type === 'photo') {
    const filePath = config.photoPath;

    return path.resolve(filePath, fileName);
  }
}

function getMessageType(message) {
  if (message.document) {
    return 'document';
  } else if (message.photo) {
    return 'photo';
  } else if (message.text) {
    return 'text';
  } else {
    const message = `Message type is unknown`;
    bot.telegram.sendMessage(`🔴 ${message}`);
    log.error(message);
    return null;
  }
}

// Listen for text messages
bot.on(message('text'), async (ctx) => {
  log.info('Received a message', ctx.message);

  // Check if the message is from the authorized user
  if (ctx.message.from.id !== config.id) {
    log.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  const type = getMessageType(ctx.message);
  if (!type) return;
  log.info(`Message type is ${type}`);

  const text = ctx.message.text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    // Download the file from the URL
    const fileName = text.split('/').pop();
    log.info(`File name is ${fileName}`);
    const filePath = getFilePath(fileName, type);
    log.info(`File path is ${filePath}`);

    downloadFile(text, filePath)
  }
});

// Listen for document | photo messages
bot.on(message, async (ctx) => {
  log.info('Received a message', ctx.message);

  // Check if the message is from the authorized user
  if (ctx.message.from.id !== config.id) {
    log.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  const type = getMessageType(ctx.message);
  if (!type) return;
  log.info(`Message type is ${type}`);

  const fileId = getFileId(ctx.message);
  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const fileName = getFileName(ctx.message);
  const filePath = getFilePath(fileName, type);

  downloadFile(fileUrl.href, filePath);
});


// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))