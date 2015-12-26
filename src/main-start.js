import Promise from "bluebird";
import gateway from "./gateway";
import log from "./log";
import pm2 from "./pm2";
import { promises, sortAppsByRoute } from "./util";




/**
 * Starts the gateway and all registered apps.
 *
 * @param {Object} settings:
 *                  - apps:           Collection of apps to start.
 *                  - manifest:       A manifest object.
 *                  - update:         Function that invokes the update method.
 *                  - port:           The port to start the gateway on.
 *                  - publishEvent:   Function that publishes an event across all containers (via RabbitMQ).
 *                  - mainApi:      The main API.
 *
 * @return {Promise}
 */
export default (settings = {}) => {
  let { apps, update, manifest, port, publishEvent, mainApi } = settings;

  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      // Setup initial conditions.
      log.info("Starting...");
      log.info("");

      // Add apps from the manifest.
      if (manifest) {
        yield manifest.update().catch(err => reject(err));
      }

      if (apps.length === 0) {
        log.warn("WARNING: No apps have been registered. Make sure a manifest has been set.");

      } else {
        // Kill all apps running in a PM2 process.
        yield pm2.connect();
        const processes = yield pm2.apps();
        if (processes.length > 0) {
          yield promises(processes.map(item => pm2.delete(item.name)));
        }

        // Start the gateway and each app.
        apps = sortAppsByRoute(apps);
        yield gateway.start({ apps, port, manifest, publishEvent, mainApi }).catch(err => reject(err));
        const { results: items } = yield promises(apps.map(app => app.start().catch(err => reject(err))));

        // Log status.
        log.info("");
        log.info(`Environment: ${ process.env.NODE_ENV || "development" }`);
        log.info(`Gateway running on port:${ port }`);
        log.info("");
        items.forEach(item => {
            if (item && item.exists) {
              const version = item.version ? ` (v${ item.version })` : "";
              log.info(` - '${ item.id }'${ version } routing '${ item.route }' => port:${ item.port }`);
            }
        });
        log.info("");

        // Ensure all apps are up-to-date.
        yield update({ start: true });

        // Finish up.
        resolve({});
      }
    })();
  });
};
