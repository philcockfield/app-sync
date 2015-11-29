import R from "ramda";
import Promise from "bluebird";
import yaml from "js-yaml";
import github from "file-system-github";



/**
 * Retrieves a manifest file from a remote repo.
 * @param {string} repoPath: The path to the `repo/file.yml:branch` to retrieve.
 * @return {Promise}
 */
export const getManifest = (repo, repoPath) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      // Extract the path.
      const parts = repoPath.trim().split(":");
      const path = parts[0].trim();
      const branch = (parts[1] || "master").trim();

      // Ensure a YAML file was specified.
      if (!path.endsWith(".yml")) {
        return reject(new Error("A path to a YAML file must be specified (.yml)"));
      }

      // Pull file from the repo.
      const download = yield repo.get(path, { branch }).catch(err => reject(err));
      const files = download && download.files;

      // Parse and return the manifest.
      if (files && files.length > 0) {
        const manifest = files[0].toString();
        try {
          resolve(yaml.safeLoad(manifest));
        } catch (e) {
          reject(new Error(`Failed while parsing YAML: ${ e.message }`));
        }
      }
    })();
  });
};



/**
 * Manages
 */
export default (userAgent, token, repoPath, main) => {
  // Create the repo proxy.
  const parts = repoPath.trim().split("/");
  const repoName = R.take(2, parts).join("/");
  const repo = github.repo(userAgent, repoName, { token })
  repoPath = R.takeLast(parts.length - 2, parts).join("/");

  const api = {
    /**
     * Connects to the remote manifest and syncs the local state with the
     * defined applications.
     * @return {Promise}
     */
    update() {
      return new Promise((resolve, reject) => {
        Promise.coroutine(function*() {

          // Retrieve the manifest from the repo.
          const manifest = yield getManifest(repo, repoPath).catch(err => reject(err));
          if (manifest) {
            // Add each app.
            for (let id of Object.keys(manifest.apps)) {
              const app = manifest.apps[id];
              if (!R.is(String, app.repo)) { throw new Error(`The app '${ id } does not have a repo, eg: user/repo/path'`); }
              if (!R.is(String, app.route)) { throw new Error(`The app '${ id } does not have a route, eg: www.domain.com/path'`); }
              main.add(id, app.repo, app.route, { branch: app.branch || "master" });
            }
          }
          resolve({ manifest });
        })();
      });
    }
  };


  // Return the API after an initial update has been run.
  return new Promise((resolve, reject) => {
    api.update()
      .then(result => resolve(api))
      .catch(err => reject(err));
  });
};
