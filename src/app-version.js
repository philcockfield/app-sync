import R from "ramda";
import Promise from "bluebird";
import semver from "semver";



/**
 * Retrieves version details for the app.
 * @param {String} id: The unique identifier of the app.
 * @param {Promise} localPackage.
 * @param {Promise} remotePackage.
 * @param {Object} statusCache: A file-system-cache for storing status about the app.
 * @return {Promise}
 */
export default (id, localPackage, remotePackage, statusCache) => {
  return new Promise((resolve, reject) => {
      const result = { id, local: null, remote: null, };
      const gettingStatus = statusCache.get(id).catch(err => reject(err));
      localPackage.catch(err => reject(err));
      remotePackage.catch(err => reject(err));

      let count = 0;
      const done = () => {
          count += 1;
          if (count === 3) {
            if (!R.isNil(result.remote)) {
              result.updateRequired = result.local === null
                  ? true
                  : semver.gt(result.remote, result.local);
            }
            statusCache.set(id, { isDownloading: false })
              .then(() => resolve(result))
              .catch(err => reject(err));
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

      gettingStatus.then(status => {
            status = status || {};
            if (status.isDownloading) { result.isDownloading = true; }
            done();
          });
  });
};
