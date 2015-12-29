import R from "ramda";
import fs from "fs-extra";
import fsPath from "path";
import shell from "shelljs";
import Promise from "bluebird";



/**
 * Determines whether the given value is Null/Undefined or Empty.
 */
export const isEmpty = (value) => {
  if (R.is(Array, value)) {
    value = R.reject(R.isNil, value);
    value = R.reject(R.isEmpty, value);
  }
  return R.isNil(value) || R.isEmpty(value);
};



/**
 * Waits for a set of promises to complete.
 * @return {Promise}
 */
export const promises = (list) => {
  list = R.reject(R.isNil, list);
  return new Promise((resolve, reject) => {
      const results = [];
      const onComplete = (result) => {
          results.push(result);
          if (results.length === list.length) { resolve({ results }); }
      };
      list.forEach(promise => {
        promise
          .then(result => onComplete(result))
          .catch(err => reject(err));
      });
  });
};



/**
 * Invokes a shell command asynchronously returning a promise.
 * @return {Promise}
 */
export const shellAsync = (cmd) => {
  return new Promise((resolve) => {
      shell.exec(cmd, (code, output) => {
        resolve({ code, output });
      });
  });
};



/**
 * Sets a timeout for the specified amount of time.
 * @param {integer} msecs: The number of milliseconds to wait.
 * @param {Function} func: The function to invoke.
 */
export const delay = (msecs, func) => global.setTimout(func, msecs);





/**
 * Loads JSON from the given path.
 * @return {Promise}
 */
export const loadFile = (path) => {
  return new Promise((resolve, reject) => {
    path = fsPath.resolve(path);
    fs.exists(path, (exists) => {
      if (exists) {
        fs.readFile(path, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve({ exists: true, content: result.toString() });
          }
        });
      } else {
        resolve({ exists: false });
      }
    });
  });
};



/**
 * Determines whether a file exists at the given path.
 * @return {Promise}
 */
export const pathExists = (path) => {
  return new Promise((resolve) => {
    fs.exists(path, (exists) => resolve(exists));
  });
};




/**
 * Loads JSON from the given path.
 * @return {Promise}
 */
export const loadJson = (path) => {
  return new Promise((resolve, reject) => {
    loadFile(path)
      .then(result => {
        try {
          if (result.exists) {
            result.json = JSON.parse(result.content);
          }
        } catch (err) { reject(err); }
        resolve(result);
      })
      .catch(err => reject(err));
  });
};







/**
 * Sorts a set of app definitions, moving the wild-card domains to the end.
 * @param apps: An array of app definitions.
 * @return {Array}.
 */
export const sortAppsByRoute = (apps) => {
    let items = apps.map(app => ({ id: app.id, app, routes: app.routes }));

    const wildcard = (item) => R.any(r => r.domain === "*", item.routes);
    const notWildcard = (app) => !wildcard(app);
    const sorted = (filter) => R.pipe(R.filter(filter), R.sortBy(R.prop("routes")));

    let wildcardDomains = sorted(wildcard)(items);
    let explicitDomains = sorted(notWildcard)(items);

    // Ensure the wild-card is at the end.
    if (wildcardDomains[0] && wildcard(wildcardDomains[0])) {
      const catchAll = wildcardDomains[0];
      wildcardDomains = R.remove(0, 1, wildcardDomains);
      wildcardDomains.push(catchAll);
    }

    // Finish up.
    items = R.union(explicitDomains, wildcardDomains);
    return items.map(item => item.app);
  };
