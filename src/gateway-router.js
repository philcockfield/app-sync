import R from "ramda";
import Promise from "bluebird";
import httpProxy from "http-proxy"; // See: https://github.com/nodejitsu/node-http-proxy


const proxy = httpProxy.createProxyServer();
proxy.on("error", (err) => {
  switch (err.code) {
    case "ECONNRESET":
      // Ignore this error:
      //    It is a bug in the `node-http-proxy` that is getting fixed.
      //    See issue: https://github.com/nodejitsu/node-http-proxy/issues/898
      break;
    default: console.error(`PROXY error:`, err);
  }
});





export default (apps, middleware) => {
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
        const target = `http://localhost:${ app.port }`;
        proxy.web(req, res, { target });
      } else {
        // No matching route.
        res.status(404).send({ message: "Not found.", domain, path });
      }
    });
};
