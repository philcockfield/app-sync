const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const DEFAULT_GATEWAY_PORT = IS_PRODUCTION ? 80 : 3000;
export const DEFAULT_APP_PORT = 5000;
export const DEFAULT_TARGET_FOLDER = "./.build";
export const POLL_INTERVAL = 3 * 1000;
