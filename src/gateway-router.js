import httpProxy from "http-proxy"; // See: https://github.com/nodejitsu/node-http-proxy
import log from "./log";


const proxy = httpProxy.createProxyServer();
proxy.on("error", (err) => {
  switch (err.code) {
    case "ECONNRESET":
      // Ignore this error:
      //    It is a bug in the `node-http-proxy` that is getting fixed.
      //    See issue: https://github.com/nodejitsu/node-http-proxy/issues/898
      break;
    default: log.error(`PROXY error:`, err);
  }
});




/**
 * Starts the gateway.
 *
 * @param options:
 *            - middleware:     The express middleware.
 *            - mainApi:        The main API.
 *
*/
export default (settings = {}) => {
  const { middleware, mainApi } = settings;

  middleware.get("*", (req, res) => {
      const host = req.get("host");
      const domain = (host && host.split(":")[0]) || "*";
      const path = req.url;
      const app = mainApi.findAppFromRoute(domain, path);

      if (app) {
        // An app matches the current route.
        // Proxy the request to it.
        const target = { host: "localhost", port: app.port };
        proxy.web(req, res, { target });

      } else {
        // No matching route.
        res.status(404).send({ message: "Route not found", domain, path });
      }
    });
};
