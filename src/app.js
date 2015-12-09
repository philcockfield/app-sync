import R from "ramda";
import uuid from "uuid";
import Promise from "bluebird";
import shell from "shelljs";
import fsPath from "path";
import github from "file-system-github";
import Route from "./route";
import { isEmpty } from "./util";
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
export default (settings = {}) => {
  // Setup initial conditions.
  let { userAgent, token, targetFolder, id, repo, port, branch, route } = settings;
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
  const fullPath = repo;
  let parts = repo.split("/");
  if (parts.length < 2) { throw new Error(`A repo must have a 'username' and 'repo-name', eg 'username/repo'.`); }
  const repoUser = parts[0];
  const repoName = parts[1];
  repo = github.repo(userAgent, `${ repoUser }/${ repoName }`, { token });
  parts = R.takeLast(parts.length - 2, parts);
  const repoSubFolder = parts.join("/");
  const localFolder = fsPath.resolve(fsPath.join(targetFolder, id));
  repo.path = repoSubFolder;
  repo.fullPath = fullPath;


  // Store values.
  const app = {
    id,
    uid: uuid.v4().toString(),
    repo,
    route,
    port,
    branch,
    localFolder,


    /**
     * Retrieves the local [package.json] file.
     * @return {Promise}
     */
    localPackage() { return getLocalPackage(id, this.localFolder); },


    /**
     * Retrieves the remote [package.json] file.
     * @return {Promise}
     */
    remotePackage() { return getRemotePackage(id, repo, repoSubFolder, branch); },


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
    download(options = {}) {
      // Don't continue if a download operation is in progress.
      if (this.downloading) { return this.downloading; }

      // Start the download process.
      this.downloading = appDownload(id, localFolder, repo, repoSubFolder, branch, options)
        .then(result => {
            this.isDownloading = false;
            delete this.downloading;
            return result;
        });
      return this.downloading;
    },


    /**
     * Downloads a new version of the app (if necessary) and restarts it.
     * @param options
     *          - start: Flag indicating if the app should be started after an update.
     *                   Default: true.
     */
    update(options = {}) {
      return appUpdate(
          id,
          localFolder,
          () => this.version(),
          (args) => this.download(args),
          (args) => this.start(args),
          options
        );
    },


    /**
     * Runs `npm install` on the app.
     * @return {Promise}.
     */
    install() { return appInstall(localFolder); },



    /**
     * Starts the app within the `pm2` process monitor.
     * @return {Promise}.
     */
    start() {
      return new Promise((resolve, reject) => {
        Promise.coroutine(function*() {
          // Update and stop.
          const status = yield this.update({ start: false }).catch(err => reject(err));
          yield this.stop().catch(err => reject(err));

          // Start the app.
          shell.cd(localFolder);
          shell.exec(`pm2 start . --name '${ id }:${ port }' --node-args '. --port ${ port }'`);
          shell.cd(WORKING_DIRECTORY);

          // Finish.
          resolve({ id, started: true, port: this.port, route: this.route, version: status.version });
        }).call(this);
      });
    },


    /**
     * Stops the app running within the 'pm2' process monitor.
     * @return {Promise}.
     */
    stop() {
      return new Promise((resolve) => {
          shell.exec(`pm2 stop '${ id }:${ port }'`);
          resolve({ id });
      });
    }
  };


  // Finish up.
  return app;
};
