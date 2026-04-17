/**
 * Helper para generar timestamp en formato [YYYY-MM-DD HH:MM:SS]
 */
function timestamp() {
  const iso = new Date().toISOString();
  const [date, timeFull] = iso.split('T');
  const time = timeFull.slice(0, 8); // HH:MM:SS
  return `[${date} ${time}]`;
}

/**
 * A utility object for logging messages with different levels of importance.
 * Provides methods for logging errors, general messages, successes, and warnings.
 * All messages are sent to stdout with timestamps.
 */
const log = {
  /**
   * Logs an error message to stdout with a red circle emoji and timestamp.
   *
   * @param {...any} args - The arguments to be logged as an error message.
   */
  error(...args) {
    console.log(timestamp(), '🔴', ...args);
  },

  /**
   * Logs an info message to stdout with a blue circle emoji and timestamp.
   *
   * @param {...any} args - The arguments to be logged as part of the info message.
   */
  info(...args) {
    console.log(timestamp(), '🔵', ...args);
  },

  /**
   * Logs a success message to stdout with a green circle emoji and timestamp.
   *
   * @param {...any} args - The arguments to be logged as part of the success message.
   */
  success(...args) {
    console.log(timestamp(), '🟢', ...args);
  },

  /**
   * Logs a warning message to stdout with an orange circle emoji and timestamp.
   *
   * @param {...any} args - The arguments to be logged as part of the warning message.
   */
  warning(...args) {
    console.log(timestamp(), '🟠', ...args);
  }
}

export default log;