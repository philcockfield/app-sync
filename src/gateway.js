import express from "express";
import Promise from "bluebird";

let server;
const app = express();



app.get("/", (req, res) => {
  res.send("Hello!");
});



/**
 * Starts the gateway.
 * @param options:
 *           - port: The port to use.
 */
const start = (options = {}) => {
    return new Promise((resolve, reject) => {
        // Ensure the gatway is not already running.
        if (server) {
          reject(new Error("The gateway server is already running."));
        }

        // Listen on the desired port.
        const port = options.port || 3000;
        server = app.listen(port, () => {
          resolve({ port, app, server });
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
