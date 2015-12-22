import R from "ramda";
import Promise from "bluebird";
import pm2 from "./pm2";
import prettyBytes from "pretty-bytes";
import { promises } from "./util";
import log from "./log";
import packageJson from "../package.json";

const HOST_NAME = process.env.HOSTNAME || "unknown";



/**
 * Provides status details about the gateway and apps.
 *
 * @param {Object} settings:
 *                  - apps:       Collection of apps to start.
 *                  - manifest:   A manifest object.
 *
 */
export default (settings = {}) => {
  const { apps, manifest } = settings;
  const processNameToAppId = (name) => name.split(":")[0];
  const getApp = (id) => {
    id = processNameToAppId(id);
    return R.find(app => app.id === id, apps);
  };


  const getAppStatus = (app, processItem) => {
      return new Promise((resolve, reject) => {
          if (!app || !processItem) {
            resolve();
            return;
          }

          const status = {
              id: app.id,
              status: processItem.pm2_env.status,
              route: `${ app.route.toString() } ⇨ ${ app.port }`,
              repository: `${ app.repo.name }:${ app.branch }`,
              resources: {
                memory: prettyBytes(processItem.monit.memory),
                cpu: processItem.monit.cpu
              }
          };

          const gettingVersion = app.version().catch(err => reject(err));
          gettingVersion.then(version => {
              status.version = {
                local: version.local,
                remote: version.remote
              };
              if (version.isUpdateRequired) { status.version.isUpdateRequired = true; }
              if (version.isDependenciesChanged) { status.version.isDependenciesChanged = true; }
              if (version.isDownloading) {
                status.status += `, updating to v${ version.remote }`;
                status.version.isDownloading = true;
              }
              resolve(status);
            });
      });
    };



  const getRunningApps = () => {
        return new Promise((resolve, reject) => {
          Promise.coroutine(function*() {
            const processes = yield pm2.apps();
            let { results } = yield promises(processes.map(item => getAppStatus(getApp(item.name), item))).catch(err => reject(err));
            results = R.reject(R.isNil)(results);
            results = R.sortBy(R.prop("id"))(results);
            resolve(results);
          })();
        });
      };



  return {
    getStatuses(req, res) {
      getRunningApps()
        .then(appsStatus => res.send({
          host: HOST_NAME,
          version: packageJson.version,
          manifest: manifest.repo.fullPath,
          apps: appsStatus
        }))
        .catch(err => {
            log.error(err);
            res.status(500).send({
              error: "Failed while getting the status of running applications",
              message: err.message
            });
        });
    },

    getAppStatus(req, res) {
      Promise.coroutine(function*() {
        const id = req.params.app;
        const app = getApp(id);
        const sendFail = (err) => res.status(500).send({ message: `Failed while getting the status of the application '${ id }'.`, err: err.message });
        if (!app) {
          res.status(404).send({ error: `The application '${ id }' does not exist.` });
        } else {
          const processes = yield pm2
              .apps(item => processNameToAppId(item.name) === id)
              .catch(err => sendFail(err));

          const item = processes[0];
          const status = yield getAppStatus(getApp(item.name), item).catch(err => sendFail(err));
          res.send(status);
        }
      })();
    }
  };
};
