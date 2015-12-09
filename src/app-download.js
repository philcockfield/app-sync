import fs from "fs-extra";
import fsPath from "path";
import Promise from "bluebird";
import { getLocalPackage } from "./app-package";
import { pathExists } from "./util";
import log from "./log";

const fsRemove = Promise.promisify(fs.remove);
const fsReadDir = Promise.promisify(fs.readdir);







/**
 * Downloads the app from the remote repository.
 *
 * @param id:           The unique ID of the application.
 * @param repo:         The repository to pull from.
 * @param subFolder:    The sub-folder into the repo (if there is one).
 * @param branch:       The branch to query.
 * @param options:
 *            - force:   Flag indicating if the repository should be downloaded if
 *                       is already present on the local disk.
 *                       Default: true
 *
 * @return {Promise}.
 */
export default (id, localFolder, repo, subFolder, branch, options = {}) => {
  const force = options.force === undefined ? true : options.force;

  return new Promise((resolve, reject) => {

    const localPackage = () => getLocalPackage(id, localFolder).catch(err => reject(err));

    const onComplete = (wasDownloaded, result) => {
          Promise.coroutine(function*() {
              const local = yield localPackage().catch(err => reject(err));
              result.version = local.json.version;
              if (wasDownloaded) {
                log.info(`...downloaded '${ id }'.`);
              }
              resolve(result);
          })();
        };


    const download = () => {
        // Check whether another process is already downloading the repo.
        Promise.coroutine(function*() {
            // Download files.
            log.info(`Downloading '${ id }'...`);
            const files = yield repo.get(subFolder, { branch }).catch(err => reject(err));

            // Delete the old files.
            // Note: The `node_modules` is retained so that NPM install does not
            //       need to be rerun unless there is a dependency change.
            if (yield pathExists(localFolder)) {
              const fileNames = yield fsReadDir(localFolder).catch(err => reject(err));
              for (let fileName of fileNames) {
                if (fileName !== "node_modules") {
                  yield fsRemove(fsPath.join(localFolder, fileName));
                }
              }
            }

            // Save the files to disk.
            yield files.save(localFolder).catch(err => reject(err));

            // Finish up.
            onComplete(true, { id });
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
