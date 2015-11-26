import R from "ramda";
import Promise from "bluebird";
import semver from "semver";



/**
 * Retrieves version details for the app.
 * @param {String} id: The unique identifier of the app.
 * @param {Promise} gettinglocalPackage.
 * @param {Promise} gettingRemotePackage.
 * @param {Object} statusCache: A file-system-cache for storing status about the app.
 * @return {Promise}
 */
export default (id, gettinglocalPackage, gettingRemotePackage, statusCache) => {
  return new Promise((resolve, reject) => {
      const isUpdateRequired = (local, remote) => {
            // return semver.gt(remote, local);
            return R.isNil(remote)
              ? false
              : local === null ? true : semver.gt(remote, local);
          };

      const isDependenciesChanged = (local, remote) => {};

      Promise.coroutine(function*() {
        // Retrieve async data.
        let status = yield statusCache.get(id, {}).catch(err => reject(err));
        const localPackage = yield gettinglocalPackage.catch(err => reject(err));
        const remotePackage = yield gettingRemotePackage.catch(err => reject(err));

        // Calculate values.
        const localVersion = localPackage.exists ? localPackage.json.version : null;
        const remoteVersion = remotePackage.exists ? remotePackage.json.version : null;
        const result = {
          id,
          local: localVersion,
          remote: remoteVersion,
          isUpdateRequired: isUpdateRequired(localVersion, remoteVersion)
        };

        // If versions match, ensure the cached downloading flag has been reset.
        if (status.isDownloading && localVersion && remoteVersion && localVersion === remoteVersion) {
          status = yield statusCache.set(id, { isDownloading: false }).catch(err => reject(err))
        }
        if (status.isDownloading) { result.isDownloading = true; }

        // Finish up.
        resolve(result)
      })();
  });
};
