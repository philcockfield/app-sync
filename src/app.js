import R from "ramda";
import shell from "shelljs";
import fsPath from "path";
import github from "file-system-github";
import { isEmpty } from "./util";




/**
 * Creates a new object representing an application.
 * @param {string} userAgent:     https://developer.github.com/v3/#user-agent-required
 * @param {string} token:         The Github authorization token to use for calls to
 *                                restricted resources.
 *                                  see: https://github.com/settings/tokens
 * @param {string} targetFolder:  The root location where apps are downloaded to.
 * @param {string} id: The unique name of the app (ID).
 * @param {repo}  repo:  The Github 'username/repo'.
 *                       Optionally you can specify a sub-path within the repos
 *                       like this:
 *                            'username/repo/my/sub/path'
 * @param {integer} port: The port the app runs on.
 * @param {Object} options:
 *                    - branch:     The branch to query. Default: "master".
 */
export default (userAgent, token, targetFolder, id, repo, port, options = {}) => {
  // Setup initial conditions.
  if (isEmpty(id)) { throw new Error("'id' for the app is required"); }
  if (isEmpty(repo)) { throw new Error("'repo' name required, eg. 'username/my-repo'"); }
  const branch = options.branch || "master";

  // Extract the repo and sub-path.
  let parts = repo.split("/");
  if (parts.length < 2) { throw new Error(`A repo must have a 'user-name' and 'repo-name', eg 'username/repo'.`); }
  const repoUser = parts[0];
  const repoName = parts[1];
  repo = github.repo(userAgent, `${ repoUser }/${ repoName }`, { token });
  parts = R.takeLast(parts.length - 2, parts);
  const repoSubFolder = parts.join("/");
  const localFolder = fsPath.resolve(fsPath.join(targetFolder, id));

  // Store values.
  const app = {
    id,
    repo,
    port,
    branch,
    localFolder,


    /**
     * Downloads the app from the remote repository.
     * @return {Promise}.
     */
    download() {
      return new Promise((resolve, reject) => {
        repo
          .get(repoSubFolder, { branch: branch })
          .then(result => result.save(localFolder))
          .catch(err => reject(err));
      });
    },


    /**
     * Starts the app within the `pm2` process monitor.
     */
    start() {
      this.stop();
      shell.cd(localFolder);
      shell.exec("npm install --loglevel error >&-");
      shell.exec(`pm2 start . --name ${ id } --node-args '. --port ${ port }'`);
    },


    /**
     * Stops the app running within the 'pm2' process monitor.
     */
    stop() {
      shell.cd(localFolder);
      shell.exec(`pm2 stop ${ id }`);
    }
  };


  // Finish up.
  return app;
};
