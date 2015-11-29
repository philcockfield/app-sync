import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import gatewayApi from "./gateway-api";
import gatewayAppRouter from "./gateway-app-router";
import { DEFAULT_GATEWAY_PORT } from "./const";

let server;



/**
 * Starts the gateway.
 * @param main: The main API of the module.
 * @param options:
 *           - port: The port to use.
 *           - manifest: The manifest to add apps from.
 */
const start = (apps, options = {}) => {
    return new Promise((resolve, reject) => {
      Promise.coroutine(function*() {
        const { manifest } = options;
        const middleware = express().use(bodyParser.json());

        // Retrieve the API route from the manifest.
        let apiRoute
        if (manifest) {
          const manifestYaml = yield manifest.get().catch(err => reject(err));
          if (manifestYaml) {
            apiRoute = manifestYaml.api
          }
        }

        // Ensure the gatway is not already running.
        if (server) {
          reject(new Error("The gateway server is already running."));
        }

        // Routes.
        if (apiRoute) { gatewayApi(apiRoute, apps, middleware, manifest); }
        gatewayAppRouter(apps, middleware);

        // Listen on the desired port.
        const port = options.port || DEFAULT_GATEWAY_PORT;
        server = middleware.listen(port, () => {
          resolve({ port });
        });
      })();
    });
  };



/**
 * Stops the gateway.
 */
const stop = () => {
    if (server) {
      server.close();
    }
    server = undefined;
  };



export default {
  start,
  stop,
  isRunning: () => server !== undefined
};
