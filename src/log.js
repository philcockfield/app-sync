
const log = (items) => console.log(items.join(" "));

/**
 * Stub log shim.
 * Pipe these log items into a proper service log.
 */
export default {
  info(...items) { log(items) },
  warn(...items) { log(items) },
  error(...items) { log(items) }
};
