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
    items.forEach(item => {
        // Extract the "to" and "from" parts.
        const parts = item.split("=>");
        let from = parts[0] && parts[0].trim();
        let to = parts[1] && parts[1].trim();

        // Parse the values into route objects.
        if (!isEmpty(from) && !isEmpty(to)) {
          from = Route.parse(from);
          to = Route.parse(to);
        } else {
          log.warn(`The redirect '${ item }' is invalid. Must be in a format like '*/from => */to'.`);
        }

        // Store.
        result.push({ from, to });
    });
    return result;
  };



const findRedirect = (domain, path, redirects) => {
  if (redirects) {
    const redirect = R.find(item => item.from.match(domain, path), redirects);

    if (redirect) {
      // Check whether the redirection is not pointing to the current URL.
      // This avoids a redirection loop getting started.
      const isCurrentUrl = redirect.to.match(domain, path);
      if (isCurrentUrl) {
        return;
      }

      // If the redirect is a root wild-card (ie, no path) ensure the
      // current URL the user is going to does not have a path.
      const isRootWildcard = redirect.from.path === "*";
      if (isRootWildcard && path !== "/") {
        return;
      }

      // Finish up.
      return redirect; //eslint-disable-line consistent-return
    }
  }
};




/**
 * Starts the gateway.
 *
 * @param options:
 *            - middleware:     The express middleware.
 *            - mainApi:        The main API.
 *            - gatewayPort:    The gateway port.
 *
*/
export default (settings = {}) => {
  const { middleware, mainApi, gatewayPort } = settings;
  const { manifest } = mainApi;

  const redirectUrl = (req, route) => {
        let { domain, path } = route;
        if (domain === "*") { domain = req.get("host").split(":")[0]; }
        if (path === "*") { path = "/"; }
        return `${ req.protocol }://${ domain }:${ gatewayPort }/${ path }`;
      };

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

      // Check if there is a redirect for the route.
      const redirect = findRedirect(domain, path, redirects);
      if (redirect) {

        // A redirection URL was found - send the browser to that address now.
        // HTTP 302: Found ("Moved Temporarily").
        const url = redirectUrl(req, redirect.to);
        res.redirect(302, url);

      } else {

        // Lookup the app.
        const app = mainApi.findAppFromRoute(domain, path);
        if (app) {

          // An app matches the current route. Proxy the request to it.
          const target = { host: "localhost", port: app.port };
          proxy.web(req, res, { target });

        } else {
          // No matching route.
          res.status(404).send({ message: "Route not found", domain, path });
        }
      }
    });
};
