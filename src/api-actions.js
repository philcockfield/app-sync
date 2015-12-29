import R from "ramda";
import log from "./log";


const delay = (msecs, func) => global.setTimeout(func, msecs);



/**
 * Manages actions that change the state of the service.
 *
 * @param {Object} settings:
 *                  - mainApi:  The main API.
 *
 */
export default (settings = {}) => {
  const { mainApi } = settings;

  const getApp = (req, res) => {
        const id = req.params.app;
        const app = R.find(item => item.id === id, mainApi.apps);
        if (app) {
          return app;
        } else {
          res.status(404).send({ message: `The app '${ id }' does not exist.` });
        }
      };


  // API.
  return {
    /**
     * Restarts the gateway and all apps.
     */
    restart(req, res) {
      log.info(`API: Restarting the gateway and all apps.`);
      res.send({ message: "Restarting..." });
      delay(200, () => {
        mainApi
          .restart()
          .catch(err => res.status(500).send({ message: err.message }));
      });
    },


    /**
     * Restarts the app on all containers.
     */
    restartApp(req, res) {
      const app = getApp(req, res);
      if (app) {
        log.info(`API: Restarting app '${ app.id }'...`);
        app.restart()
          .then(result => {
              res.send({ app: app.id, restarted: true, version: result.version });
              log.info(`API:...Restarted app '${ app.id }'.`);
          })
          .catch(err => res.status(500).send({ message: err.message }));
      }
    },


    /**
     * Checks for updates for the app.
     */
    update(req, res) {
      const app = getApp(req, res);
      if (app) {
        log.info(`API: Updating app '${ app.id }'...`);
        app.update()
          .then(result => {
              res.send({ app: app.id, updated: result.updated, version: result.version });
              const msg = result.updated
                ? `API: ...updated app '${ app.id }' to version ${ result.version }.`
                : `API: ...did not update app '${ app.id }', latest version ${ result.version } already running.`;
              log.info(msg);
          })
          .catch(err => res.status(500).send({ message: err.message }));
      }
    }
  };
};
