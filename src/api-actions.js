import R from "ramda";
import Promise from "bluebird";
import log from "./log";




/**
 * Manages actions that change the state of the service.
 *
 * @param {Object} settings:
 *                  - apps:           Collection of apps to start.
 *                  - publishEvent:   Function that publishes an event across all containers (via RabbitMQ).
 *
 */
export default (settings = {}) => {
  const { apps, publishEvent } = settings;

  const getApp = (req, res) => {
        const id = req.params.app;
        const app = R.find(item => item.id === id, apps);
        if (app) {
          return app;
        } else {
          res.status(404).send({ message: `The app '${ id }' does not exist.` });
        }
      };

  // API.
  return {
    /**
     * Restarts the app on all containers.
     */
    restart(req, res) {
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
              log.info(`API:...Updated app '${ app.id }'.`);
          })
          .catch(err => res.status(500).send({ message: err.message }));
      }
    }
  };
};
