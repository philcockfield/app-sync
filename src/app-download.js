import Promise from "bluebird";
import { getLocalPackage, getRemotePackage } from "./app-package";
import appInstall from "./app-install";
import log from "./log";



/**
 * Downloads the app from the remote repository.
 *
 * @param id:           The unique ID of the application.
 * @param localFolder:  The path to where the app it stored on the local disk.
 * @param repo:         The repository to pull from.
 * @param subFolder:    The sub-folder into the repo (if there is one).
 * @param branch:       The branch to query.
 * @param options:
 *            - install: Flag indicating if `npm install` should be run on the directory.
 *                       Default: true.
 *            - force:   Flag indicating if the repository should be downloaded if
 *                       is already present on the local disk.
 *                       Default: true
 *
 * @return {Promise}.
 */
export default (id, localFolder, repo, subFolder, branch, options = {}) => {
  const install = options.install == undefined ? true : options.install;
  const force = options.force === undefined ? true : options.force;

  return new Promise((resolve, reject) => {
    const onComplete = (wasDownloaded, result) => {
          if (wasDownloaded) { log.info(`...downloaded '${ id }'.`); }
          resolve(result)
        };

    const onSaved = (result) => {
          if (install) {
            // Run `npm install`.
            appInstall(localFolder)
              .then(() => {
                  result.installed = true;
                  onComplete(true, result);
              })
              .catch(err => reject(err));
          } else {
            onComplete(true, result); // Return without running `npm install`.
          }
        };

    // Download the repository files.
    const download = () => {
        log.info(`Downloading app '${ id }'...`);
        repo
          .get(subFolder, { branch })
          .then(result => {
              result.save(localFolder)
                .then(result => onSaved({ id, files: result.files }))
                .catch(err => reject(err));
          })
          .catch(err => reject(err));
      };


    if (force) {
      download();
    } else {
      // Check whether the app exists, before downloading.
      getLocalPackage(localFolder)
        .then(local => {
            if (local.exists) {
              onComplete(false, { alreadyExists: true });
            } else {
              download();
            }
        })
        .catch(err => reject(err));
    }
  });
};
