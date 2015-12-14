import R from "ramda";
import pm2 from "./pm2";
import Route from "./route";
import apiStatus from "./gateway-api-status";
import apiWebHook from "./gateway-api-webhook";

import log from "./log";


let isConnected = false;
pm2.connect().then(() => isConnected = true);



export default (baseRoute, apps, middleware, manifest) => {
  baseRoute = Route.parse(baseRoute);
  const status = apiStatus(apps);
  const webhook = apiWebHook(apps, manifest);
  const tokens = R.pipe(
      R.reject(R.isNil),
      R.reject(R.isEmpty)
    )((manifest.current && manifest.current.api && manifest.current.api.tokens) || []);

  const isRouteMatch = (req) => {
        const domain = req.get("host").split(":")[0];
        return baseRoute.domain === "*" || domain === baseRoute.domain;
      };

  const isAuthenticated = (req) => {
        if (tokens.length === 0) {
          return true;
        } else {
          return R.any(token => token === req.query.token)(tokens);
        }
      };

  const handleRequest = (req, res, next, handler) => {
      return isConnected
        ? isRouteMatch(req)
            ? isAuthenticated(req)
                ? handler(req, res)
                : res.status(403).send({ error: "A valid token was not specified" })
            : next()
        : res.status(500).send({ isInitialized: false });
    };

  // Register routes.
  const register = (verb, path, handler) => {
        path = `/${ baseRoute.path + path }`;
        log.info(` - ${ verb }: ${ baseRoute.domain }${ path }`);
        middleware[verb](path, (req, res, next) => handleRequest(req, res, next, handler));
      };
  const get = (path, handler) => register("get", path, handler);
  const post = (path, handler) => register("post", path, handler);

  log.info("API:");
  get(":app", status.getAppStatus);
  get(":app/restart", status.getAppStatus);
  get("", status.getStatuses);
  post("repo", webhook.post);
  log.info("");
};
