import axios from 'axios';
import fs from 'fs';
import path from 'path';

import { Telegraf, Markup } from 'telegraf'
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

// Map to store pending download requests waiting for destination selection
// Key format: "chatId:messageId"
// Value format: { url, fileName, destinations }
const pendingDownloads = new Map();

/**
 * Downloads a file from the specified URL and saves it to the given file path.
 *
 * @param {Object} ctx - The context object, used for replying and logging.
 * @param {string} url - The URL of the file to download.
 * @param {string} filePath - The local file path where the downloaded file will be saved.
 * @returns {Promise<void>} A promise that resolves when the file is successfully downloaded, or rejects on error.
 */
async function downloadFile(ctx, url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const fileName = path.basename(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      const message = `${fileName} downloaded to ${filePath}`;
      ctx.reply(`🟢 ${fileName} downloaded successfully`)
      log.success(message);

      resolve();
    });
    writer.on('error', (err) => {
      const message = `Error downloading ${fileName}`;
      ctx.reply(`🔴 ${message}`);
      log.error(message, err);

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
 * Retrieves the destination(s) for a given file name and type based on its extension.
 * Returns an array of { label, path } objects. Extensions are matched against the
 * configured extensions lists.
 *
 * @param {string} fileName - The name of the file, including its extension.
 * @param {string} type - The type of the file, such as 'audio', 'document', 'text', 'photo' or 'video'.
 * @returns {Array<{label: string, path: string}>} Array of available destinations for this file.
 */
function getDestinations(fileName, type) {
  const ext = path.extname(fileName).toLowerCase();
  const { extensions, destinations, defaultPath } = config;

  // Type-specific routing
  if (type === 'audio') {
    return destinations.audio;
  }

  if (type === 'photo') {
    return destinations.photo;
  }

  if (type === 'video') {
    return destinations.video;
  }

  // Document/Text: check extension to determine actual type
  if (type === 'document' || type === 'text') {
    if (extensions.audio.includes(ext))    return destinations.audio;
    if (extensions.document.includes(ext)) return destinations.document;
    if (extensions.photo.includes(ext))    return destinations.photo;
    if (extensions.torrent.includes(ext))  return destinations.torrent;
    if (extensions.video.includes(ext))    return destinations.video;
  }

  // Fallback to default destination
  return [{ label: 'Default', path: defaultPath }];
}

/**
 * Check if a message has downloadable content (audio, document, photo, text, or video).
 * Filters out Telegram service messages (e.g., "auto-delete enabled" notifications).
 *
 * @param {Object} message - The message object.
 * @returns {boolean} True if message has downloadable content.
 */
function isMessageDownloadable(message) {
  if (!message) return false;
  return !!(message.audio || message.document || message.photo || message.text || message.video);
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
    const errorMsg = `Message type is unknown`;
    ctx.reply(`🔴 ${errorMsg}`);
    log.error(errorMsg);
    return null;
  }
}

/**
 * Handles file download logic with optional destination selection.
 * If multiple destinations are configured for the file type, sends an inline keyboard
 * for the user to choose. Otherwise, downloads immediately.
 *
 * @param {Object} ctx - The Telegraf context object
 * @param {string} url - The download URL
 * @param {string} fileName - The file name
 * @param {string} type - The detected file type
 */
async function handleFileMessage(ctx, url, fileName, type) {
  // Guard: ensure ctx and ctx.message exist
  if (!ctx || !ctx.message) {
    log.error('Invalid context: ctx or ctx.message is undefined');
    return;
  }

  const destinations = getDestinations(fileName, type);
  log.info(`${fileName} detected as ${type}`);

  // Single destination: download immediately
  if (destinations.length === 1) {
    const filePath = path.resolve(destinations[0].path, fileName);
    return downloadFile(ctx, url, filePath);
  }

  // Multiple destinations: ask user which one to use
  try {
    const key = `${ctx.chat.id}:${ctx.message.message_id}`;
    pendingDownloads.set(key, { url, fileName, destinations });

    const buttons = destinations.map((dest, i) =>
      Markup.button.callback(dest.label, `dest:${key}:${i}`)
    );

    await ctx.reply(`Where should I save ${fileName}?`, Markup.inlineKeyboard(buttons));
  } catch (err) {
    log.error(`Error in handleFileMessage:`, err);
    try {
      await ctx.reply(`🔴 Error selecting destination`);
    } catch (replyErr) {
      log.error(`Failed to send error message:`, replyErr);
    }
  }
}

// Listen for text messages
bot.on(message('text'), async (ctx) => {
  // Check if the message is from the authorized user
  if (ctx.message.from.id !== config.id) {
    log.error(`Unauthorized user ${ctx.message.from.id} tried to send a message`);
    return;
  }

  const type = getMessageType(ctx);
  if (!type) return;

  const text = ctx.message.text;
  const match = text.match(/(https?:\/\/[^\s]+)/);
  if (match) {
    const url = match[1];
    const fileName = url.split('/').pop();
    await handleFileMessage(ctx, url, fileName, type);
  }
});

// Listen for audio | document | photo | video messages
bot.on('message', async (ctx) => {
  // Ignore Telegram service messages (e.g., "auto-delete enabled" notifications)
  if (!isMessageDownloadable(ctx.message)) {
    return;
  }

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

  await handleFileMessage(ctx, fileUrl.href, fileName, type);
});

// Handle inline keyboard button presses (destination selection)
bot.action(/^dest:/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const data = ctx.callbackQuery.data;
    log.info(`Destination callback: ${data}`);

    // Parse callback data: "dest:chatId:messageId:destinationIndex"
    const parts = data.split(':');
    if (parts.length !== 4) {
      log.error(`Invalid callback format: ${data}`);
      return;
    }

    const key = `${parts[1]}:${parts[2]}`;
    const index = parseInt(parts[3], 10);

    const pending = pendingDownloads.get(key);

    if (!pending) {
      log.warning(`Pending download not found for key: ${key}`);
      await ctx.reply('🔴 This download request has expired.');
      return;
    }

    const dest = pending.destinations[index];

    if (!dest) {
      log.error(`Invalid destination index: ${index}`);
      return;
    }

    pendingDownloads.delete(key);
    log.info(`Saving ${pending.fileName} to ${dest.label} (${dest.path})`);

    const filePath = path.resolve(dest.path, pending.fileName);
    await downloadFile(ctx, pending.url, filePath);
  } catch (err) {
    log.error(`Error handling destination callback:`, err);
  }
});

// Start the bot (allowedUpdates ensures Telegram sends callback_query events)
bot.launch({ allowedUpdates: ['message', 'callback_query'] });

log.success('file-bot started and waiting for messages');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
