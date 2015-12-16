/*
  Provides access to the PM2 API in a way that won't break if
  PM2 is not installed (globally) on the development machine.

  This is useful when running tests within a CI environment.

  ----------

  See: http://pm2.keymetrics.io/docs/usage/pm2-api/
*/
import R from "ramda";
import Promise from "bluebird";

const stubPromise = () => new Promise(() => {});
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

} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    // Ignore.
    // - PM2 is not installed. Use the fake promises.

    /*eslint no-empty:0*/

  } else { throw err; }
}


/**
 * Retrieves processes of running apps.
 */
const apps = (filter) => {
    return new Promise((resolve) => {
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
  };


/**
 * Determines whether an app with the given ID exists.
 * @param {String} processName: The unique name of the PM2 process.
 * @return {Promise}.
 */
const exists = (processName) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      try {
        const matchingApps = yield apps(item => item.name === processName);
        resolve(matchingApps.length > 0);
      } catch (err) { reject(err); }
    }).call(this);
  });
};


/**
 * Kills and deletes the specified process.
 * @param {String} processName: The unique name of the PM2 process.
 * @return {Promise}.
 */
const deleteProcess = (processName) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      try {
        if (yield exists(processName)) {
          yield deleteP(processName);
          resolve({ deleted: true });
        } else {
          resolve({ deleted: false });
        }
      } catch (err) { reject(err); }
    }).call(this);
  });
};


// API.
export default {
  connect: () => connectP(),
  list: () => listP(),
  delete: (processName) => deleteProcess(processName),
  apps: (filter) => apps(filter),
  exists: (processName) => exists(processName)
};
