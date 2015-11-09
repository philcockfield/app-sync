import express from "express";
import Promise from "bluebird";
import gatewayRouter from "./gateway-router";
import { DEFAULT_GATEWAY_PORT } from "./const";

let server;
const app = express();



/**
 * Starts the gateway.
 * @param apps:   An array of {app} objects.
 * @param options:
 *           - port: The port to use.
 */
const start = (apps, options = {}) => {
    return new Promise((resolve, reject) => {
        // Ensure the gatway is not already running.
        if (server) {
          reject(new Error("The gateway server is already running."));
        }

        // Router.
        gatewayRouter(apps, app);

        // Listen on the desired port.
        const port = options.port || DEFAULT_GATEWAY_PORT;
        server = app.listen(port, () => {
          resolve({ port });
        });
    });
  };



/**
 * Stops the gateway.
 */
const stop = () => {
    if (server) {
      server.close();
    }
  };



export default { start, stop };
