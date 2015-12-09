import Promise from "bluebird";
import gateway from "./gateway";
import log from "./log";
import pm2 from "./pm2";
import { promises, sortAppsByRoute } from "./util";
import { DEFAULT_GATEWAY_PORT } from "./const";




/**
 * Starts the gateway and all registered apps.
 * @param apps: Collection of apps to start.
 * @param update: Function that invokes the update method.
 * @param apiRoute: The route to explose the API on.
 * @param manifest: A manifest object.
 * @param options
 *            - port: The port to start the gateway on.
 * @return {Promise}
 */
export default (apps, update, apiRoute, manifest, options = {}) => {
  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {
      // Setup initial conditions.
      log.info("Starting...");
      log.info("");
      const GATEWAY_PORT = options.port === undefined ? DEFAULT_GATEWAY_PORT : options.port;

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
        yield gateway.start(apps, { port: GATEWAY_PORT, apiRoute, manifest }).catch(err => reject(err));
        const { results: items } = yield promises(apps.map(app => app.start().catch(err => reject(err))));

        // Log status.
        log.info("");
        log.info(`Environment: ${ process.env.NODE_ENV || "development" }`);
        log.info(`Gateway running on port:${ GATEWAY_PORT }`);
        log.info("");
        items.forEach(item => {
            const version = item.version ? ` (v${ item.version })` : "";
            log.info(` - '${ item.id }'${ version } routing '${ item.route }' => port:${ item.port }`);
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
