import R from "ramda";
import Promise from "bluebird";
import shell from "shelljs";
import gateway from "./gateway";
import log from "./log";
import { promises, sortAppsByRoute } from "./util";

import {
  DEFAULT_GATEWAY_PORT,
} from "./const";
const GATEWAY_PORT = DEFAULT_GATEWAY_PORT;







/**
 * Starts the gateway and all registered apps.
 * @param apps: Collection of apps to start.
 * @param update: Function that invokes the update method.
 * @return {Promise}
 */
export default (apps, update) => {
  return new Promise((resolve, reject) => {
    // Setup initial conditions.
    log.info("Starting...");
    log.info("");

    if (apps.length === 0) {
      log.warn("WARNING: No apps have been registered.");

    } else {
      Promise.coroutine(function*() {
          // Start the gateway and each app.
          apps = sortAppsByRoute(apps);
          yield gateway.start(apps, { port: GATEWAY_PORT }).catch(err => reject(err));
          const { results: items } = yield promises(apps.map(app => app.start().catch(err => reject(err))));

          // Log status.
          log.info("");
          log.info(`Environment: ${ process.env.NODE_ENV || "development" }`)
          log.info(`Gateway running on port:${ GATEWAY_PORT }`);
          console.log("");
          items.forEach(item => {
              const version = item.version ? ` (v${ item.version })` : "";
              log.info(` - '${ item.id }'${ version } routing '${ item.route }' => port:${ item.port }`);
          });
          console.log("");

          // Ensure all apps are up-to-date.
          yield update({ start: true });
      })();

      // Finish up.
      resolve({});
    }
  });
};
