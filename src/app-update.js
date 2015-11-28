import fsPath from "path";
import Promise from "bluebird";
import appInstall from "./app-install";
import log from "./log";
import { pathExists } from "./util";




/**
 * Downloads a new version of the app (if necessary) and restarts it.
 * @param {String} id: The unique identifier of the app.
 * @param {String} localFolder:  The path to where the app it stored on the local disk.
 * @param {Function} getVersion: Function that gets the version details.
 * @param {Function} startDownload: Function that initiates a download.
 * @param {Function} start: Function that starts the application.
 * @param options
 *          - start: Flag indicating if the app should be started after an update.
     *               Default: true.
 */
export default (id, localFolder, getVersion, startDownload, start, options = {}) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      const restartAfterUpdate = options.start === undefined ? true : options.start;
      const version = yield getVersion().catch(err => reject(err));
      const result = { id, updated: false, installed: false, version: version.remote };

      if (version.isUpdateRequired && !version.isDownloading) {
        log.info();
        log.info(`Updating '${ id }' from v${ version.local } to v${ version.remote }...`);

        // Download remote files.
        yield startDownload().catch(err => reject(err));

        // NPM install if required.
        const nodeModulesPath = fsPath.join(localFolder, "node_modules");
        const nodeModulesExist = yield pathExists(nodeModulesPath).catch(err => reject(err));
        if (!nodeModulesExist || version.isDependenciesChanged) {
          yield appInstall(localFolder);
          result.installed = true;
        }

        // Start the app if required.
        if (restartAfterUpdate) {
          yield start().catch(err => reject(err));
        }

        // Log output.
        const msg = restartAfterUpdate
            ? `...updated and restarted '${ id }' to v${ version.remote }.`
            : `...updated '${ id }' to v${ version.remote }.`;
        log.info("");
        log.info(msg);
        result.updated = true;
      }

      // Finish up.
      resolve(result);
    })();
  });
};
