/*
  Provides access to the PM2 API in a way that won't break if
  PM2 is not installed (globally) on the development machine.

  This is useful when running tests within a CI environment.

  ----------

  See: http://pm2.keymetrics.io/docs/usage/pm2-api/
*/
import R from "ramda";
import Promise from "bluebird";

const stubPromise = () => new Promise((resolve, reject) => {});
let pm2;
let connectP = stubPromise;
let listP = stubPromise;
let deleteP = stubPromise;

// Attempt to access PM2.
try {
  pm2 = require("pm2");

  // Create promise versions of PM2 methods.
  connectP = Promise.promisify(pm2.connect);
  listP = Promise.promisify(pm2.list);
  deleteP = Promise.promisify(pm2.delete);


} catch (e) {
  if (e.code === "MODULE_NOT_FOUND") {
    // Ignore.
  } else {
    throw e;
  }
}


export default {
  // PM2 API.
  connect: () => connectP(),
  list: () => listP(),
  delete: (id) => deleteP(id),

  /**
   * Retrieves processes of running apps.
   */
  apps(filter) {
    return new Promise((resolve, reject) => {
      Promise.coroutine(function*() {
        let list = yield listP();
        const isAppProcess = (item) => {
              // Apps can be identified by having a port in the 5000 range,
              // eg: <name>:5001
              const parts = item.name.split(":");
              return parts.length < 2
                  ? false
                  : parts[1].startsWith("5");
            };
        list = R.filter(isAppProcess, list);
        if (filter) { list = R.filter(filter, list); }
        resolve(list);
      })();
    });
  }
};
