/*
  Provides access to the PM2 API in a way that won't break if
  PM2 is not installed (globally) on the development machine.

  This is useful when running tests within a CI environment.

  ----------

  See: http://pm2.keymetrics.io/docs/usage/pm2-api/
*/
let pm2;

try {
  pm2 = require("pm2");
} catch (e) {
  if (e.code === "MODULE_NOT_FOUND") {
    // Ignore.
  } else {
    throw e;
  }
}


export default {
  connect(callback) { if (pm2) { pm2.connect(callback); } },
  list(callback) { if (pm2) { pm2.list(callback); } }
};
