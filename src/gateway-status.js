import R from "ramda";
import pm2 from "pm2";
import prettyBytes from "pretty-bytes";
import { GATEWAY_ROUTE } from "./const";
import { promises } from "./util";

let isConnected = false;
pm2.connect(() => isConnected = true);




export default (apps, middleware) => {
  const getRunningApps = () => {
    return new Promise((resolve, reject) => {

      const getApp = (id) => R.find(item => item.id === id, apps);
      const getRunningApp = (id) => {
            const app = getApp(id);
            return {
              id,
              port: app.port,
              route: app.route.toString(),
              repo: app.repo.name,
              branch: app.branch,
            };
          };

      const appendVersions = (runningApps) => {
          const gettingVersions = runningApps.map(runningApp => {
            return getApp(runningApp.id).version()
              .then(version => {
                delete version.id;
                runningApp.version = version;
                return version;
              });
          });
          return promises(gettingVersions);
        };


      pm2.list((err, list) => {
          if (err) {
            reject(err);
          } else {
            let runningApps = list.map(item => {
                  let app = getRunningApp(item.name);
                  app = R.merge(app, {
                    memory: prettyBytes(item.monit.memory),
                    cpu: item.monit.cpu,
                    status: item.pm2_env.status
                  })
                  return app;
                });

            appendVersions(runningApps)
              .then(result => resolve(runningApps))
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
