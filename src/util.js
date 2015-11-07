import R from "ramda";
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
