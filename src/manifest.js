import R from "ramda";
import Promise from "bluebird";
import yaml from "js-yaml";
import github from "file-system-github";
import gateway from "./gateway";


/**
 * Retrieves a manifest file from a remote repo.
 * @param {string} repoPath: The path to the `repo/file.yml:branch` to retrieve.
 * @return {Promise}
 */
export const getManifest = (repo, repoPath, branch) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      // Ensure a YAML file was specified.
      if (!repoPath.endsWith(".yml")) {
        return reject(new Error("A path to a YAML file must be specified (.yml)"));
      }

      // Pull file from the repo.
      const download = yield repo.get(repoPath, { branch }).catch(err => reject(err));
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
 * Manages the manifest of applications.
 */
export default (userAgent, token, repoPath, main) => {
  // Create the repo proxy.
  let parts = repoPath.trim().split("/");
  const repoName = R.take(2, parts).join("/");
  const repo = github.repo(userAgent, repoName, { token })
  const getApp = (id) => R.find(item => item.id === id, main.apps);

  // Extract the path and branch.
  repoPath = R.takeLast(parts.length - 2, parts).join("/");
  parts = repoPath.split(":");
  repoPath = parts[0].trim();
  const branch = (parts[1] || "master").trim();

  const api = {
    repo: {
      name: repoName,
      path: repoPath,
      branch
    },


    /**
     * Retrieves the manfest.
     * @return {Promise}
     */
    get() { return getManifest(repo, this.repo.path, this.repo.branch); },


    /**
     * Connects to the remote manifest and syncs the local state with the
     * defined applications.
     * @return {Promise}
     */
    update() {
      const self = this;
      return new Promise((resolve, reject) => {
        Promise.coroutine(function*() {
          let restart = false;

          // Retrieve the manifest from the repo.
          const manifest = yield self.get().catch(err => reject(err));
          if (manifest) {

            // Check for global changes with the previous manifest.
            if (self.current) {
              if (!R.equals(self.current.api, manifest.api)) { restart = true; }
            }

            const isChanged = (manifestApp, app) => {
                  let repo = app.repo;
                  if (!manifestApp.repo.startsWith(app.repo.name)) { return true; }
                  if (app.repo.path && !manifestApp.repo.endsWith(app.repo.path)) { return true; }
                  if (manifestApp.route !== app.route.toString()) { return true; }
                  if (manifestApp.branch !== app.branch) { return true; }
                  return false;
                };

            const addApp = (id, manifestApp) => {
                  main.add(id, manifestApp.repo, manifestApp.route, { branch: manifestApp.branch });
                };


            // Remove apps that are no longer specified in the manifest.
            const manifestKeys = Object.keys(manifest.apps);
            for (let app of main.apps) {
              const isWithinManifest = R.any(key => key === app.id, manifestKeys);
              if (!isWithinManifest) {
                yield main.remove(app.id);
                restart = true;
              }
            }

            // Add or update each app.
            for (let id of manifestKeys) {
              const manifestApp = manifest.apps[id];
              if (!R.is(String, manifestApp.repo)) { throw new Error(`The app '${ id } does not have a repo, eg: user/repo/path'`); }
              if (!R.is(String, manifestApp.route)) { throw new Error(`The app '${ id } does not have a route, eg: www.domain.com/path'`); }
              manifestApp.branch = manifestApp.branch || "master";
              const app = getApp(id);
              if (app) {
                if (isChanged(manifestApp, app)) {
                  // The app has changed.  Replace it with the new definition.
                  yield main.remove(id);
                  addApp(id, manifestApp);
                  restart = true;
                }
              } else {
                // The app has not yet been added.  Add it now.
                addApp(id, manifestApp);
                restart = true;
              }
            }

            // Restart the gateway if a change occured (and it's already running)
            if (gateway.isRunning() && restart) {
              yield main.stop();
              yield main.start();
            }
          }
          this.current = manifest; // Store for future refernce.
          resolve({ manifest });
        }).call(this);
      });
    }
  };

  // Finish up.
  return api;
};
