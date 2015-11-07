import R from "ramda";
import Promise from "bluebird";
import app from "./app";
import { isEmpty, promises } from "./util";

const DEFAULT_PORT = 5000;



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
  const targetFolder = settings.targetFolder || "./.build"
  const token = settings.token;

  return {
    apps: [],
    userAgent,
    targetFolder,

    /**
     * Adds a new application to run.
     * @param {string} id:   The unique name of the app (ID).
     * @param {repo}  repo:  The Github 'username/repo'.
     *                       Optionally you can specify a sub-path within the repos
     *                       like this:
     *                            'username/repo/my/sub/path'
     * @param {Object} options:
     *                    - branch: The branch to query.
     *                              Default: "master".
     */
    add(id, repo, options = {}) {
      // Setup initial conditions.
      if (R.find(item => item.id === id, this.apps)) {
        throw new Error(`An app with the ID '${ id }' has already been registered.`);
      }

      // Create the App object.
      const port = DEFAULT_PORT + (this.apps.length);
      const item = app(userAgent, token, targetFolder, id, repo, port, options);
      this.apps.push(item);

      // Finish up.
      return this;
    },


    /**
     * Downloads all registered apps.
     * @return {Promise}
     */
    download() {
      return new Promise((resolve, reject) => {
        promises(this.apps.map(app => app.download()))
          .then(result => resolve({ apps: result.results }))
          .catch(err => reject(err));
      });
    }
  };
};
