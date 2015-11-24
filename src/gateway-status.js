import R from "ramda";
import pm2 from "pm2";
import prettyBytes from "pretty-bytes";
import { GATEWAY_ROUTE } from "./const";
import { promises } from "./util";

let isConnected = false;
pm2.connect(() => isConnected = true);



const getAppStatus = (app, processItem) => {
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



const getProcesses = (filter) => {
      return new Promise((resolve, reject) => {
        pm2.list((err, processes) => {
          if (err) {
            reject(err)
          } else {
            if (filter) {
              processes = R.filter(filter, processes);
            }
            resolve(processes);
          }
        });
      });
    };




export default (apps, middleware) => {
  const getApp = (id) => R.find(app => app.id === id, apps);
  const getRunningApps = () => {
        return new Promise((resolve, reject) => {
          getProcesses()
            .then(processes => {
                promises(processes.map(processItem => getAppStatus(getApp(processItem.name), processItem)))
                  .then(result => resolve(result.results))
                  .catch(err => reject(err));
            })
            .catch(err => reject(err));
        });
      };


  const routeStatus = (req, res) => {
      const gettingRunningApps = getRunningApps().catch(err => res.status(500).send({ error: "Failed while getting the status of running applications" }));
      gettingRunningApps.then(appsStatus => {
        res.send({ apps: appsStatus });
      });
    };


  const routeAppStatus = (req, res) => {
      const id = req.params.app;
      const app = getApp(id);
      const sendFail = () => res.status(500).send({ error: "Failed while getting the status of the application '${ id }'." });
      if (!app) {
        res.status(404).send({ error: `The application '${ id }' does not exist.` });
      } else {
        const sendStatus = (processItem) => {
              getAppStatus(getApp(processItem.name), processItem)
                .then(result => res.send(result))
                .catch(err => sendFail());
            };
        getProcesses(item => item.name === id)
          .then(processes => sendStatus(processes[0]))
          .catch(err => sendFail());
      }
    };


  // Register routes.
  const gatewayRoute = GATEWAY_ROUTE.replace(/^\//, "");
  middleware.get(`/${ gatewayRoute }/:app`, (req, res) => {
        isConnected ? routeAppStatus(req, res) : res.send({ isInitialized: false })
      });
  middleware.get(`/${ gatewayRoute }`, (req, res) => {
        isConnected ? routeStatus(req, res) : res.send({ isInitialized: false })
      });
};
