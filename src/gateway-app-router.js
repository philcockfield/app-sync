import R from "ramda";
import Promise from "bluebird";
import httpProxy from "http-proxy"; // See: https://github.com/nodejitsu/node-http-proxy
import { sortAppsByRoute } from "./util";
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





export default (apps, middleware) => {
  apps = sortAppsByRoute(apps);
  const findMatchingApp = (domain, path) => {
        return R.find(app => app.route.match(domain, path), apps);
      };

  middleware.get("*", (req, res) => {
      const domain = req.get("host").split(":")[0];
      const path = req.url;
      const app = findMatchingApp(domain, path);
      if (app) {
        // An app matches the current route.
        // Proxy the request to it.
        const target = { host: "localhost", port: app.port };
        // log.info(`Route: ${ req.path } => port:${ app.port }`);
        proxy.web(req, res, { target });
      } else {
        // No matching route.
        res.status(404).send({ message: "Route not found", domain, path });
      }
    });
};
