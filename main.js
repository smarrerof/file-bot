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
 * Downloads a file from the specified URL and saves it to the given file path.
 *
 * @param {Object} ctx - The context object, used for replying and logging.
 * @param {string} url - The URL of the file to download.
 * @param {string} filePath - The local file path where the downloaded file will be saved.
 * @param {Object} config - Configuration object containing additional settings (e.g., `id` for context reply).
 * @returns {Promise<void>} A promise that resolves when the file is successfully downloaded, or rejects on error.
 */
async function downloadFile(ctx, url, filePath) {
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
      ctx.reply(`🟢 ${message}`)
      log.success(message);

      resolve();
    });
    writer.on('error', () => {
      const message = `Error downloading ${fileName}`;
      ctx.reply(`🔴 ${message}`);
      log.error(message);
      log.error(err);

      reject();
    });
  });
}

/**
 * Extracts the file ID from a message object.
 * 
 * @param {Object} message - The message object containing file information.
 * @returns {string|undefined} The file ID of the document or the last photo in the array, or undefined if neither is present.
 */
function getFileId(message) {
  if (message.audio) {
    const audio = message.audio;
    return audio.file_id;
  } else if (message.document) {
    const document = message.document;
    return document.file_id;
  } else if (message.photo) {
    const photo = message.photo.pop();
    return photo.file_id;
  } else if (message.video) {
    const video = message.video;
    return video.file_id;
  }
}

/**
 * Extracts the file name from a given message object based on its type.
 *
 * @param {Object} message - The message object containing file information.
 * @returns {string|undefined} The extracted file name, or `undefined` if no valid file type is found.
 */
function getFileName(message) {
  if (message.audio) {
    const audio = message.audio;
    const fileName = audio.file_name;
    
    return fileName;
  } else if (message.document) {
    const document = message.document;
    const fileName = document.file_name;
    
    return fileName;
  } else if (message.photo) {
    const photo = message.photo.pop();
    const fileName = `${photo.file_unique_id}.jpeg`
    
    return fileName;
  } else if (message.video) {
    const video = message.video;
    const fileName = video.file_name;
    
    return fileName;
  }
}

/**
 * Retrieves the file path for a given file name and type based on its extension.
 *
 * @param {string} fileName - The name of the file, including its extension.
 * @param {string} type - The type of the file, such as 'audio', 'document', 'text', 'photo' or 'video'.
 * @returns {string} The resolved file path for the specified file name and type.
 */
function getFilePath(fileName, type) {
  const audioExtensions = ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.opus', '.wav', '.wma'];
  const documentExtensions = ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.txt', '.xls', '.xlsx'];
  const photoExtensions = ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.tiff', '.webp'];
  const torrentExtensions = ['.torrent'];
  const videoExtensions = ['.avi', '.flv', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.wmv'];

  let filePath = config.defaultPath;
  if (type === 'audio') {
    const fileExtension = path.extname(fileName);
    if (!audioExtensions.includes(fileExtension)) {
      filePath = config.audioPath;
    }
  } else if (type === 'document' || type === 'text') {    
    const fileExtension = path.extname(fileName);
    if (documentExtensions.includes(fileExtension)) {
      filePath = config.documentPath;
    } else if (photoExtensions.includes(fileExtension)) {
      filePath = config.photoPath;
    } else if (torrentExtensions.includes(fileExtension)) {
      filePath = config.torrentPath;
    } else if (videoExtensions.includes(fileExtension)) {
      filePath = config.videoPath;
    }
  } else if (type === 'photo') {
    filePath = config.photoPath;
  } else if (type === 'video') {
    filePath = config.videoPath;
  }
  return path.resolve(filePath, fileName);
}

/**
 * Determines the type of a message from the given context object.
 *
 * @param {Object} ctx - The context object containing the message.
 * @returns {string|null} The type of the message ('audio', 'document', 'photo', 'text', 'video'), or `null` if the type is unknown.
 */
function getMessageType(ctx) {
  const message = ctx.message;
  if (message.audio) {
    return 'audio';
  } else if (message.document) {
    return 'document';
  } else if (message.photo) {
    return 'photo';
  } else if (message.text) {
    return 'text';
  } else if (message.video) {
    return 'video';
  } else {
    const message = `Message type is unknown`;
    ctx.reply(`🔴 ${message}`);
    log.error(message);
    return null;
  }
}

// Listen for text messages
bot.on(message('text'), async (ctx) => {
  // log.info('Received a text message', ctx.message);

  // Check if the message is from the authorized user
  if (ctx.message.from.id !== config.id) {
    log.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  const type = getMessageType(ctx);
  if (!type) return;

  const text = ctx.message.text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    // Download the file from the URL
    const fileName = text.split('/').pop();
    const filePath = getFilePath(fileName, type);

    downloadFile(ctx, text, filePath)
  }
});

// Listen for audio | document | photo | video messages
bot.on(message, async (ctx) => {
  // log.info('Received a message', ctx.message);

  // Check if the message is from the authorized user
  if (ctx.message.from.id !== config.id) {
    log.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  const type = getMessageType(ctx);
  if (!type) return;

  const fileId = getFileId(ctx.message);
  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const fileName = getFileName(ctx.message);
  const filePath = getFilePath(fileName, type);

  downloadFile(ctx, fileUrl.href, filePath);
});


// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))