import R from "ramda";
import httpProxy from "http-proxy"; // See: https://github.com/nodejitsu/node-http-proxy
import log from "./log";
import Route from "./route";
import { isEmpty } from "./util";


// Create Proxy server and handle errors.
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




const formatRedirects = (items) => {
    const result = [];
    items.forEach((item, i) => {
        // Extract the "to" and "from" parts.
        const parts = item.split("=>");
        let from = parts[0] && parts[0].trim();
        let to = parts[1] && parts[1].trim();

        // Parse the values into route objects.
        if (!isEmpty(from) && !isEmpty(to)) {
          from = Route.parse(from);
          to = Route.parse(to);
        } else {
          log.warn(`The redirect '${ item }' is invalid. Must be in a format like '*/from => */to'.`)
        }

        // Store.
        result.push({ from, to });
    });
    return result;
  };


const redirectUrl = (req, route) => {
    let { domain, path } = route;
    if (domain === "*") { domain = req.get("host"); }
    if (path === "*") { path = "/"; }
    return `${ req.protocol }://${ domain }/${ path }`;
  };




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
  const { manifest } = mainApi;


  // Read in the redirect table from the manifest (if it exists).
  let redirects = manifest.current && manifest.current.redirect;
  if (redirects) {
    redirects = formatRedirects(redirects);
  }


  middleware.get("*", (req, res) => {
      // Setup initial conditions.
      const host = req.get("host");
      const domain = (host && host.split(":")[0]) || "*";
      const path = req.url;
      const findRedirect = () => redirects && R.find(item => item.from.match(domain, path), redirects)

      // Check if there is a redirect for the route.
      const redirect = findRedirect();
      if (redirect) {

        // A redirection URL was found - send the browser to that address now.
        res.redirect(302, redirectUrl(req, redirect.to));

      } else {

        // Lookup the app.
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
      }
    });
};
