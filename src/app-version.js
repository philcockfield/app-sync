import R from "ramda";
import Promise from "bluebird";
import semver from "semver";



/**
 * Retrieves version details for the app.
 * @param {Promise} localPackage.
 * @param {Promise} remotePackage.
 * @return {Promise}
 */
export default (localPackage, remotePackage) => {
  return new Promise((resolve, reject) => {
      const result = { local: null, remote: null, };
      localPackage.catch(err => reject(err));
      remotePackage.catch(err => reject(err));

      let count = 0;
      const done = () => {
          count += 1;
          if (count === 2) {
            if (R.isNil(result.remote)) {
              result.updateRequired = result.local === null
                  ? true
                  : semver.gt(result.remote, result.local);
            }
            resolve(result);
          }
        };

      remotePackage.then(remote => {
            if (remote.exists) { result.remote = remote.json.version || "0.0.0"; }
            done();
          });

      localPackage.then(local => {
            if (local.exists) { result.local = local.json.version || "0.0.0"; }
            done();
          });
  });
};
