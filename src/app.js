import R from "ramda";
import Promise from "bluebird";
import shell from "shelljs";
import fs from "fs-extra";
import fsPath from "path";
import github from "file-system-github";
import Route from "./route";
import log from "./log";
import { isEmpty, shellAsync, loadJson, promises } from "./util";
import { DEFAULT_APP_PORT, DEFAULT_TARGET_FOLDER } from "./const";

import appInstall from "./app-install";
import appVersion from "./app-version";
import appDownload from "./app-download";
import appUpdate from "./app-update";
import { getLocalPackage, getRemotePackage } from "./app-package";


/**
 * Creates a new object representing an application.
 * @param options:
 *            - id:            The unique name of the app (ID).
 *            - userAgent:     https://developer.github.com/v3/#user-agent-required
 *            - token:         The Github authorization token to use for calls to
 *                             restricted resources.
 *                                 see: https://github.com/settings/tokens
 *            - route:         Route details for directing requests to the app.
 *            - targetFolder:  The root location where apps are downloaded to.
 *            - repo:          The Github 'username/repo'.
 *                             Optionally you can specify a sub-path within the repos
 *                             like this:
 *                                 'username/repo/my/sub/path'
 *            - port:          The port the app runs on.
 *            - branch:        The branch to query. Default: "master".
 */
export default (options = {}) => {
  // Setup initial conditions.
  let { userAgent, token, targetFolder, id, repo, port, branch, route } = options;
  if (isEmpty(id)) { throw new Error(`'id' for the app is required`); }
  if (isEmpty(repo)) { throw new Error(`'repo' name required, eg. 'username/my-repo'`); }
  if (isEmpty(userAgent)) { throw new Error(`The github API user-agent must be specified.  See: https://developer.github.com/v3/#user-agent-required`); }
  if (isEmpty(route)) { throw new Error(`A 'route' must be specified for the '${ id }' app.`); }
  route = Route.parse(route);
  branch = branch || "master";
  targetFolder = targetFolder || DEFAULT_TARGET_FOLDER;
  port = port || DEFAULT_APP_PORT;
  const WORKING_DIRECTORY = process.cwd();

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
    route,
    port,
    branch,
    localFolder,
    isRunning: false,

    /**
     * Retrieves the local [package.json] file.
     * @return {Promise}
     */
    localPackage() { return getLocalPackage(this.localFolder); },


    /**
     * Retrieves the remote [package.json] file.
     * @return {Promise}
     */
    remotePackage() { return getRemotePackage(repo, repoSubFolder, branch); },


    /**
     * Gets the local and remote versions.
     * @return {Promise}
     */
    version() { return appVersion(id, this.localPackage(), this.remotePackage()); },


    /**
     * Downloads the app from the remote repository.
     * @param options:
     *            - install: Flag indicating if `npm install` should be run on the directory.
     *                       Default: true.
     *            - force:   Flag indicating if the repository should be downloaded if
     *                       is already present on the local disk.
     *                       Default: true
     * @return {Promise}.
     */
    download(options = {}) { return appDownload(id, localFolder, repo, repoSubFolder, branch, options); },


    /**
     * Downloads a new version of the app (if necessary) and restarts it.
     */
    update() {
      return appUpdate(
          id,
          () => this.version(),
          (options) => this.start(options)
        );
    },


    /**
     * Runs `npm install` on the app.
     * @return {Promise}.
     */
    install() { return appInstall(localFolder); },



    /**
     * Starts the app within the `pm2` process monitor.
     * @param options
     *            - download: Flag indicating if the repo should be downloaded
     *                        even if it exists locally. Default: false.
     * @return {Promise}.
     */
    start(options = {}) {
      const download = options.download === undefined ? false : options.download;
      return new Promise((resolve, reject) => {
        this.download({ force: download })
          .then(result => {
              this.stop();
              shell.cd(localFolder);
              shell.exec(`pm2 start . --name ${ id } --node-args '. --port ${ port }'`);
              shell.cd(WORKING_DIRECTORY);
              this.isRunning = true;
              resolve();
          })
          .catch(err => reject(err));
      });
    },


    /**
     * Stops the app running within the 'pm2' process monitor.
     * @return {Promise}.
     */
    stop() {
      return new Promise((resolve, reject) => {
          shell.exec(`pm2 stop ${ id }`);
          this.isRunning = false;
          resolve();
      });
    }
  };


  // Finish up.
  return app;
};
