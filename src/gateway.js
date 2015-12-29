import express from "express";
import bodyParser from "body-parser";
import Promise from "bluebird";
import api from "./api";
import gatewayRouter from "./gateway-router";
import { DEFAULT_GATEWAY_PORT } from "./const";

let server;



/**
 * Starts the gateway.
 * @param options:
 *            - port:           The port to use.
 *            - publishEvent:   Function that publishes an event across all containers (via RabbitMQ).
 *            - mainApi:        The main API.
 *
 */
const start = (settings = {}) => {
    return new Promise((resolve, reject) => {
      Promise.coroutine(function*() {
        const { mainApi } = settings;
        const { manifest } = mainApi;
        const port = settings.port || DEFAULT_GATEWAY_PORT;
        const middleware = express().use(bodyParser.json());

        // Retrieve the API route from the manifest.
        let apiRoute;
        if (manifest) {
          try {
            yield manifest.get().catch(err => reject(err));
          } catch (err) {
            reject(err);
            return;
          }
          apiRoute = manifest.current && manifest.current.api && manifest.current.api.route;
        }

        // Ensure the gatway is not already running.
        if (server) {
          reject(new Error("The gateway server is already running."));
        }

        // Routes.
        if (apiRoute) { api({ apiRoute, middleware, mainApi }); }
        gatewayRouter({ middleware, mainApi, gatewayPort: port });

        // Listen on the desired port.
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
