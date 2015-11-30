import R from "ramda";
import Promise from "bluebird";
import shell from "shelljs";
import app from "./app";
import gateway from "./gateway";
import log from "./log";
import start from "./main-start";
import manifest from "./manifest";
import { promises } from "./util";
import {
  DEFAULT_APP_PORT,
  DEFAULT_TARGET_FOLDER,
} from "./const";



// Ensure PM2 is installed globally.
if (shell.exec("pm2 -v", { silent: true }).code !== 0) {
  log.warn("WARNING: The PM2 (Process Manager) must be install globally, run: `npm install -g pm2`.");
}



/**
 * Initializes a new app syncer.
 * @param settings:
 *          - userAgent:      https://developer.github.com/v3/#user-agent-required
 *          - token:          The Github authorization token to use for calls to
 *                            restricted resources.
 *                               see: https://github.com/settings/tokens
 *          - targetFolder:   The path where apps are downloaded to.
 *          - apiRoute:       The route to the gateway API.
 *          - manifest:       The <repo>/<path>:<branch> of the manifest YAML file.
 */
export default (settings = {}) => {
  const userAgent = settings.userAgent || "app-syncer";
  const targetFolder = settings.targetFolder || DEFAULT_TARGET_FOLDER;
  const token = settings.token;

  const api = {
    apps: [],
    userAgent,
    targetFolder,

    /**
     * Adds a new application to run.
     * @param {string} id:    The unique name of the app (ID).
     * @param {string} repo:  The Github 'username/repo'.
     *                        Optionally you can specify a sub-path within the repos
     *                        like this:
     *                            'username/repo/my/sub/path'
     * @param {string} route: Route details for directing requests to the app.
     * @param {Object} options:
     *                    - branch: The branch to query.
     *                              Default: "master".
     */
    add(id, repo, route, options = {}) {
      // Setup initial conditions.
      if (R.find(item => item.id === id, this.apps)) {
        throw new Error(`An app with the ID '${ id }' has already been registered.`);
      }
      if (R.find(item => item.route.toString() === route, this.apps)) {
        throw new Error(`An app with the route '${ route }' has already been registered.`);
      }

      // Create the App object.
      const port = DEFAULT_APP_PORT + (this.apps.length);
      const item = app({
        userAgent,
        token,
        targetFolder,
        id,
        repo,
        route,
        port,
        branch: options.branch
      });
      this.apps.push(item);

      // Finish up.
      return this;
    },


    /**
     * Stops and removes the specified app.
     * @param id: The unique identifier of the app.
     * @return {Promise}
     */
    remove(id) {
      return new Promise((resolve, reject) => {
        Promise.coroutine(function*() {
          const removeApp = R.find(item => item.id === id, this.apps);
          if (!removeApp) {
            reject(new Error(`An app with the id '#{ id }' does not exist.`));
          } else {
            log.info(`Removing app '${ id }'`);

            // Stop the app if it's running.
            yield removeApp.stop();

            // Remove the app from the list.
            const index = R.findIndex(item => item.id === id, this.apps);
            this.apps.splice(index, 1);

            // Finish up.
            resolve({});
          }
        }).call(this);
      });
    },


    /**
     * Downloads all registered apps.
     * @param options:
     *            - install: Flag indicating if `npm install` should be run on the directory.
     *                       Default: true.
     * @return {Promise}
     */
    download(options = {}) {
      return new Promise((resolve, reject) => {
        promises(this.apps.map(item => item.download(options)))
          .then(result => resolve({ apps: result.results }))
          .catch(err => reject(err));
      });
    },



    /**
     * Performs an update on all registered apps.
     * @param options
     *          - start: Flag indicating if the app should be started after an update.
     */
    update(options = {}) {
      return new Promise((resolve, reject) => {
        const updatingApps = this.apps.map(item => item.downloading
                                            ? null // Don't update an app that is currently downloading.
                                            : item.update(options));
        promises(updatingApps)
          .then(result => resolve({ apps: result.results }))
          .catch(err => reject(err));
      });
    },



    /**
     * Starts the gateway and apps.
     * @return {Promise}
     */
    start() {
      return start(
        this.apps,
        (options) => this.update(options),
        settings.apiRoute,
        this.manifest
      );
    },



    /**
     * Stops the gateway and all running apps.
     * @return {Promise}
     */
    stop() {
      log.info("Stopping...");
      return new Promise((resolve) => {
          gateway.stop();
          this.apps.forEach(item => item.stop());
          log.info("");
          log.info("Gateway and apps stopped.");
          resolve({});
        });
    }
  };

  // Configure the manifest, if one was set.
  if (settings.manifest) {
    api.manifest = manifest(userAgent, token, settings.manifest, api);
  }

  // Finish up.
  return api;
};
