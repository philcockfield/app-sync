import Promise from "bluebird";
import { loadJson } from "./util";


/**
 * Retrieves the local [package.json] file.
 * @param localFolder: The path to where the app it stored on the local disk.
 * @return {Promise}
 */
export const getLocalPackage = (localFolder) => {
    return new Promise((resolve, reject) => {
      loadJson(`${ localFolder }/package.json`)
        .then(file => {
          resolve({ exists: file.exists, json: file.json })
        })
        .catch(err => reject(err))
    });
};



/**
 * Retrieves the remote [package.json] file.
 * @param repo:       The repository to pull from.
 * @param subFolder:  The sub-folder into the repo (if there is one).
 * @param branch:     The branch to query.
 * @return {Promise}
 */
export const getRemotePackage = (repo, subFolder, branch) => {
    return new Promise((resolve, reject) => {
      repo.get(`${ subFolder }/package.json`, { branch })
        .then(result => {
            const file = result.files[0];
            if (file) {
              try {
                const json = JSON.parse(file.content);
                resolve({ exists: true, json })
              } catch (err) { reject(err); }

            } else {
              resolve({ exists: false });
            }
        })
        .catch(err => reject(err));
    });
};
