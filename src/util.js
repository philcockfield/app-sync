import R from "ramda";
import fs from "fs-extra";
import fsPath from "path";
import shell from "shelljs";
import Promise from "bluebird";



/**
 * Determines whether the given value is Null/Undefined or Empty.
 */
export const isEmpty = (value) => (R.isNil(value) || R.isEmpty(value));



/**
 * Waits for a set of promises to complete.
 * @return {Promise}
 */
export const promises = (list) => {
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
  return new Promise((resolve, reject) => {
      shell.exec(cmd, (code, output) => {
        resolve({ code, output })
      });
  });
};



/**
 * Sets a timeout for the specified amount of time.
 * @param {integer} msecs: The number of milliseconds to wait.
 * @param {Function} func: The function to invoke.
 */
export const delay = (msecs, func) => setTimout(func, msecs);





/**
 * Loads JSON from the given path.
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
        })
      } else {
        resolve({ exists: false })
      }
    });
  });
};



/**
 * Loads JSON from the given path.
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
