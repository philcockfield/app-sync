import fs from "fs-extra";
import Promise from "bluebird";
import { getLocalPackage, getRemotePackage } from "./app-package";
import appInstall from "./app-install";
import log from "./log";
const fsRemove = Promise.promisify(fs.remove);



const waitForDownload = (id, statusCache) => {
  return new Promise((resolve, reject) => {
      const checkDownloadState = () => {
        Promise.coroutine(function*() {
          const { isDownloading } = yield statusCache.get(id).catch(err => reject(err));
          if (isDownloading) {
            setTimeout(() => checkDownloadState(), 1000); // <== Delayed recursion.
          } else {
            resolve();
          }
        })();
      };
      checkDownloadState();
  });
};





/**
 * Downloads the app from the remote repository.
 *
 * @param id:           The unique ID of the application.
 * @param localFolder:  The path to where the app it stored on the local disk.
 * @param repo:         The repository to pull from.
 * @param subFolder:    The sub-folder into the repo (if there is one).
 * @param branch:       The branch to query.
 * @param statusCache:  A file-system-cache for storing status about the app.
 * @param options:
 *            - install: Flag indicating if `npm install` should be run on the directory.
 *                       Default: true.
 *            - force:   Flag indicating if the repository should be downloaded if
 *                       is already present on the local disk.
 *                       Default: true
 *
 * @return {Promise}.
 */
export default (id, localFolder, repo, subFolder, branch, statusCache, options = {}) => {
  const install = options.install == undefined ? true : options.install;
  const force = options.force === undefined ? true : options.force;
  const localPackage = () => getLocalPackage(id, localFolder).catch(err => reject(err));

  return new Promise((resolve, reject) => {
    const onComplete = (wasDownloaded, result) => {
          Promise.coroutine(function*() {
              const local = yield localPackage().catch(err => reject(err));
              result.version = local.json.version;
              if (wasDownloaded) {
                log.info(`...downloaded '${ id }'.`);
                yield statusCache.set(id, { isDownloading: false }).catch(err => reject(err));
              }
              resolve(result);
          })();
        };


    const download = () => {
        // Check whether another process is already downloading the repo.
        Promise.coroutine(function*() {
          const { isDownloading } = yield statusCache.get(id, { isDownloading: false }).catch(err => reject(err));
          if (isDownloading) {

            // Another process is already downloading - wait for it to complete.
            yield waitForDownload(id, statusCache).catch(err => reject(err));
            onComplete(true, { id, downloadedByAnotherProcess: true });

          } else {

            // Download and save the repo files.
            log.info(`Downloading '${ id }'...`);
            yield statusCache.set(id, { isDownloading: true });
            const files = yield repo.get(subFolder, { branch }).catch(err => reject(err));
            yield fsRemove(localFolder).catch(err => reject(err));
            yield files.save(localFolder).catch(err => reject(err));
            if (install) {
              // Run `npm install`.
              yield appInstall(localFolder);
              onComplete(true, { id, installed: true });
            } else {
              onComplete(true, { id }); // Return without running `npm install`.
            }
          }
        })();
      };

    // Don't download if the app files already exist.
    Promise.coroutine(function*() {
      if (force) {
        download();
      } else {
        const local = yield localPackage();
        if (local.exists) {
          onComplete(false, { alreadyExists: true });
        } else {
          download();
        }
      }
    })();
  });
};
