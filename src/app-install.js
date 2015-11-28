import Promise from "bluebird";
import shell from "shelljs";
import { shellAsync } from "./util";

const WORKING_DIRECTORY = process.cwd();



/**
 * Runs `npm install` on the app.
 * @param localFolder: The path to where the app it stored on the local disk.
 * @return {Promise}.
 */
export default (localFolder) => {
    return new Promise((resolve, reject) => {
        shell.cd(localFolder);
        shellAsync("npm install --loglevel error >&-")
          .then(result => {
              shell.cd(WORKING_DIRECTORY);
              if (result.code === 0) {
                resolve(result);
              } else {
                result.error = `Failed while running 'npm install'.`;
                reject(result);
              }
          })
          .catch(err => reject(err))
          .finally(() => shell.cd(WORKING_DIRECTORY));
    });

};
