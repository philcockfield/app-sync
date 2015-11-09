import R from "ramda";
import Promise from "bluebird";
import app from "./app";
import { isEmpty, promises } from "./util";
import gateway from "./gateway";
import log from "./log";
import {
  DEFAULT_APP_PORT,
  DEFAULT_GATEWAY_PORT,
  DEFAULT_TARGET_FOLDER,
} from "./const";





/**
 * Initializes a new app syncer.
 * @param settings:
 *          - userAgent:    https://developer.github.com/v3/#user-agent-required
 *          - targetFolder: The root location where apps are downloaded to.
 *          - token:        The Github authorization token to use for calls to
 *                          restricted resources.
 *                             see: https://github.com/settings/tokens
 */
export default (settings = {}) => {
  const userAgent = settings.userAgent || "app-syncer";
  const targetFolder = settings.targetFolder || DEFAULT_TARGET_FOLDER
  const token = settings.token;

  return {
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
     * Downloads all registered apps.
     * @param options:
     *            - install: Flag indicating if `npm install` should be run on the directory.
     *                       Default: true.
     * @return {Promise}
     */
    download(options = {}) {
      return new Promise((resolve, reject) => {
        promises(this.apps.map(app => app.download(options)))
          .then(result => resolve({ apps: result.results }))
          .catch(err => reject(err));
      });
    },



    /**
     * Performs an update on all registered apps.
     */
    update() {
      return new Promise((resolve, reject) => {
        promises(this.apps.map(app => app.update()))
          .then(result => resolve({ apps: result.results }))
          .catch(err => reject(err));
      });
    },



    /**
     * Starts the gateway and apps.
     * @return {Promise}
     */
    start() {
      return new Promise((resolve, reject) => {
        // Start the gateway (proxy).
        log.info("Starting...");
        gateway.start(this.apps, { port: DEFAULT_GATEWAY_PORT })
          .then(result => {
            // Start each app.
            this.apps.forEach(app => app.start());

            // Log.
            log.info("");
            log.info(`Gateway running on port:${ result.port }`);
            this.apps.forEach(app => {
              log.info(` - '${ app.id }' routing '${ app.route }' => port:${ app.port }`);
            });
            log.info("");
            log.info("");
            this.update(); // Ensure all apps are up-to-date.
            resolve({ gateway: result });
          })
          .catch(err => reject(err));
      });
    },



    /**
     * Stops the gateway and all running apps.
     */
    stop() {
      log.info("Stopping...");
      return new Promise((resolve, reject) => {
          gateway.stop();
          this.apps.forEach(app => app.stop());
          log.info("");
          log.info("Gateway and apps stopped.");
          resolve({});
        });
    }
  };
};
