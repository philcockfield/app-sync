import R from "ramda";
import pm2 from "pm2";
import prettyBytes from "pretty-bytes";
import { GATEWAY_ROUTE } from "./const";
import { promises } from "./util";

let isConnected = false;
pm2.connect(() => isConnected = true);



export const getAppStatus = (app, processItem) => {
      const status = {
          id: app.id,
          status: processItem.pm2_env.status,
          route: `${ app.route.toString() } ⇨ ${ app.port }`,
          repository: `${ app.repo.name }:${ app.branch }`,
          resources: {
            memory: prettyBytes(processItem.monit.memory),
            cpu: processItem.monit.cpu,
          }
      };

      return new Promise((resolve, reject) => {
        const gettingVersion = app.version().catch(err => reject(err));
        gettingVersion.then(version => {
            status.version = {
              local: version.local,
              repository: version.remote
            };
            if (version.updateRequired) { app.update(); }
            resolve(status);
          });
      });
    };




export default (apps, middleware) => {
  const getRunningApps = () => {
    return new Promise((resolve, reject) => {
      pm2.list((err, processes) => {
          if (err) {
            reject(err);
          } else {
            promises(processes.map(processItem => {
                const app = R.find(appItem => appItem.id === processItem.name, apps);
                return getAppStatus(app, processItem);
              }))
              .then(result => resolve(result.results))
              .catch(err => reject(err));
          }
        });
    });
  };


  const getStatus = (req, res) => {
      const gettingRunningApps = getRunningApps().catch(err => res.status(500).send({ message: "Failed while getting running applications" }));
      gettingRunningApps.then(runningApps => {
        res.send({ apps: runningApps });
      });
    };


  // Register route.
  const gatewayRoute = GATEWAY_ROUTE.replace(/^\//, "");
  middleware.get(`/${ gatewayRoute }`, (req, res) => {
      isConnected ? getStatus(req, res) : res.send({ isInitialized: false })
  });
};
