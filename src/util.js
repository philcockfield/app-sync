import R from "ramda";
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
