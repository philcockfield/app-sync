import R from "ramda";
import Promise from "bluebird";
import semver from "semver";



/**
 * Retrieves version details for the app.
 * @param {String} id: The unique identifier of the app.
 * @param {Promise} gettinglocalPackage.
 * @param {Promise} gettingRemotePackage.
 * @return {Promise}
 */
export default (id, gettinglocalPackage, gettingRemotePackage) => {
  return new Promise((resolve, reject) => {
      const isUpdateRequired = (localVersion, remoteVersion) => {
            return R.isNil(remoteVersion)
              ? false
              : localVersion === null ? true : semver.gt(remoteVersion, localVersion);
          };

      const isDependenciesChanged = (localJson, remoteJson) => {
            if (R.isNil(localJson)) { return false; }
            if (R.isNil(remoteJson)) { return false; }
            const local = localJson.dependencies || {};
            const remote = remoteJson.dependencies || {};
            const localKeys = Object.keys(local);
            const remoteKeys = Object.keys(remote);
            if (localKeys.length !== remoteKeys.length) { return true; }
            const index = 0;
            const isChanged = (key) => {
              if (localKeys[index] !== remoteKeys[index]) { return false; }
              return local[key] !== remote[key];
            };
            return R.any(isChanged)(Object.keys(local));
          };

      Promise.coroutine(function*() {
        // Retrieve async data.
        const localPackage = yield gettinglocalPackage.catch(err => reject(err));
        const remotePackage = yield gettingRemotePackage.catch(err => reject(err));

        // Calculate values.
        const localVersion = localPackage.exists ? localPackage.json.version : null;
        const remoteVersion = remotePackage.exists ? remotePackage.json.version : null;
        const result = {
          id,
          local: localVersion,
          remote: remoteVersion,
          isUpdateRequired: isUpdateRequired(localVersion, remoteVersion),
          isDependenciesChanged: isDependenciesChanged(localPackage.json, remotePackage.json)
        };

        // Finish up.
        resolve(result);
      })();
  });
};
