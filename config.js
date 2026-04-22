import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml';

// Load environment variables
dotenv.config();

const DEFAULT_PATH = '/downloads';

const DEFAULT_EXTENSIONS = {
  audio:    ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.opus', '.wav', '.wma'],
  document: ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.txt', '.xls', '.xlsx'],
  photo:    ['.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.tiff', '.webp'],
  torrent:  ['.torrent'],
  video:    ['.avi', '.flv', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.wmv'],
};

const DEFAULT_DESTINATIONS = {
  audio:    [{ label: 'Downloads', path: DEFAULT_PATH }],
  document: [{ label: 'Downloads', path: DEFAULT_PATH }],
  photo:    [{ label: 'Downloads', path: DEFAULT_PATH }],
  torrent:  [{ label: 'Downloads', path: DEFAULT_PATH }],
  video:    [{ label: 'Downloads', path: DEFAULT_PATH }],
};

/**
 * Load routing configuration from YAML file.
 * Returns empty object if file does not exist or parsing fails.
 *
 * Tries:
 * 1. CONFIG_DIR environment variable (if set)
 * 2. /config (Docker mount)
 * 3. ./config (local development)
 */
function loadRouting() {
  let configDir;

  if (process.env.CONFIG_DIR) {
    configDir = process.env.CONFIG_DIR;
  } else if (fs.existsSync('/config')) {
    configDir = '/config';
  } else {
    configDir = './config';
  }

  const routingPath = `${configDir}/routing.yaml`;

  console.log(`[config] Reading routing config from ${routingPath}`);

  if (!fs.existsSync(routingPath)) {
    console.log(`[config] ${routingPath} not found, using defaults (all files -> /downloads)`);
    return {};
  }

  try {
    const content = fs.readFileSync(routingPath, 'utf8');
    const result = yaml.load(content) ?? {};
    console.log(`[config] routing.yaml loaded successfully`);
    return result;
  } catch (err) {
    console.error(`[config] Error parsing routing.yaml: ${err.message}`);
    console.error(`[config] Falling back to defaults (all files -> /downloads)`);
    return {};
  }
}

const routing = loadRouting();

const config = {
  token:        process.env.TELEGRAM_BOT_TOKEN,
  id:           Number(process.env.TELEGRAM_CHAT_ID),
  defaultPath:  process.env.DOWNLOAD_DEFAULT_PATH ?? DEFAULT_PATH,
  destinations: { ...DEFAULT_DESTINATIONS, ...(routing.destinations ?? {}) },
  extensions:   { ...DEFAULT_EXTENSIONS,   ...(routing.extensions   ?? {}) },
};

console.log('[config] Configured destinations:');
for (const [type, dests] of Object.entries(config.destinations)) {
  const labels = dests.map(d => `${d.label} (${d.path})`).join(', ');
  console.log(`[config]   ${type}: ${labels}`);
}

export default config;
