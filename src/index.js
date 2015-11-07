import R from "ramda";
import fsPath from "path";
import github from "file-system-github";

const DEFAULT_PORT = 5000;
let githubSettings = {};
const isEmpty = (value) => (R.isNil(value) || R.isEmpty(value));



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
  const targetFolder = settings.targetFolder || "./.synced-apps"
  const token = settings.token;

  return {
    apps: [],
    userAgent,
    targetFolder,


    /**
     * Adds a new application to run.
     * @param {string} name: The unique name of the app (ID).
     * @param {repo}  repo:  The Github 'username/repo'.
     *                       Optionally you can specify a sub-path within the repos
     *                       like this:
     *                            'username/repo/my/sub/path'
     * @param {Object} options:
     *                    - branch: The branch to query.
     *                              Default: "master".
     */
    add(name, repo, options = {}) {
      // Setup initial conditions.
      if (isEmpty(name)) { throw new Error("'name' of app required"); }
      if (isEmpty(repo)) { throw new Error("'repo' name required, eg. 'username/my-repo'"); }
      if (R.find(item => item.name === name, this.apps)) {
        throw new Error(`An app with the name '${ name }' has already been registered.`);
      }

      // Extract the repo and sub-path.
      const parts = repo.split("/");
      if (parts.length < 2) { throw new Error(`A repo must have a 'user-name' and 'repo-name', eg 'username/repo'.`); }
      repo = github.repo(userAgent, `${ parts[0] }/${ parts[1] }`, { token });
      const path = R.takeLast(parts.length - 2, parts).join("/");

      // Store values.
      const item = R.clone(options);
      item.name = name;
      item.repo = repo;
      item.branch = item.branch || "master";
      item.port = DEFAULT_PORT + (this.apps.length);
      if (!isEmpty(path)) { item.path = path; }
      this.apps.push(item);

      /**
       * Downloads the app from the remote repository.
       * @return {Promise}.
       */
      item.download = () => {
          const targetPath = fsPath.resolve(`${ targetFolder }/${ name }`);
          return repo.copy(path, targetPath, { branch: item.branch });
        };

      // Finish up.
      return this;
    }
  };
};
