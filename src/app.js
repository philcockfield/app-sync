import R from "ramda";
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
 * @param {string} name: The unique name of the app (ID).
 * @param {repo}  repo:  The Github 'username/repo'.
 *                       Optionally you can specify a sub-path within the repos
 *                       like this:
 *                            'username/repo/my/sub/path'
 * @param {integer} port: The port the app runs on.
 * @param {Object} options:
 *                    - branch: The branch to query.
 *                              Default: "master".
 */
export default (userAgent, token, targetFolder, name, repo, port, options = {}) => {
  // Setup initial conditions.
  if (isEmpty(name)) { throw new Error("'name' of app required"); }
  if (isEmpty(repo)) { throw new Error("'repo' name required, eg. 'username/my-repo'"); }
  const branch = options.branch || "master";

  // Extract the repo and sub-path.
  const parts = repo.split("/");
  if (parts.length < 2) { throw new Error(`A repo must have a 'user-name' and 'repo-name', eg 'username/repo'.`); }
  repo = github.repo(userAgent, `${ parts[0] }/${ parts[1] }`, { token });
  const path = R.takeLast(parts.length - 2, parts).join("/");

  // Store values.
  const app = {
    name,
    repo,
    port,
    branch,

    /**
     * Downloads the app from the remote repository.
     * @return {Promise}.
     */
    download() {
      const targetPath = fsPath.resolve(`${ targetFolder }/${ name }`);
      return repo.copy(path, targetPath, { branch: branch });
    }
  };
  if (!isEmpty(path)) { app.path = path; }

  // Finish up.
  return app;
};
