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
    apps = sortAppsByRoute(apps);
    log.info("Starting...");

    const startApps = promises(apps.map(app => app.start())).then(result => result.results);
    const startGateway = gateway.start(apps, { port: GATEWAY_PORT });

    const onComplete = (items = []) => {
        log.info("");
        log.info("");
        log.info(`Gateway running on port:${ GATEWAY_PORT }`);
        console.log("");
        items.forEach(item => {
            const version = item.version ? ` (v${ item.version })` : "";
            log.info(` - '${ item.id }'${ version } routing '${ item.route }' => port:${ item.port }`);
        });
        console.log("");
        update({ start: true }); // Ensure all apps are up-to-date.
        resolve({});
    };

    if (apps.length === 0) {
      log.warn("WARNING: No apps have been registered.");
      onComplete();
    } else {
      startGateway
        .then(() => startApps.then(items => onComplete(items)))
        .catch(err => reject(err));
    }
  });
};
