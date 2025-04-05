/**
 * A utility object for logging messages with different levels of importance.
 * Provides methods for logging errors, general messages, successes, and warnings.
 */
const log = {
  /**
   * Logs an error message to the console with a red circle emoji as a prefix.
   *
   * @param {...any} args - The arguments to be logged as an error message.
   */
  error(...args) {
    console.error('🔴', ...args);
  },

  /**
   * Logs an info message to the console with an orange circle emoji as a prefix.
   *
   * @param {...any} args - The arguments to be logged as part of the info message.
   */
  info(...args) {
    console.log(...args);
  },

  /**
   * Logs a success message to the console with a green circle emoji.
   *
   * @param {...any} args - The arguments to be logged as part of the success message.
   */
  success(...args) {
    console.error('🟢', ...args);
  },

  /**
   * Logs a warning message to the console with an orange circle emoji as a prefix.
   *
   * @param {...any} args - The arguments to be logged as a warning message.
   */
  warning(...args) {
    console.error('🟠', ...args);
  }
}

export default log;