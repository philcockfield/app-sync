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

  const isRouteMatch = (req) => {
        const domain = req.get("host").split(":")[0];
        return baseRoute.domain === "*" || domain === baseRoute.domain;
      };

  // Register routes.
  const register = (verb, path, handler) => {
        path = `/${ baseRoute.path + path }`;
        log.info(` - ${ verb }: ${ baseRoute.domain }${ path }`);
        middleware[verb](path, (req, res, next) => {
            return isConnected
              ? isRouteMatch(req) ? handler(req, res) : next()
              : res.status(500).send({ isInitialized: false });
          });
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
