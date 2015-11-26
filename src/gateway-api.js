import R from "ramda";
import Promise from "bluebird";
import pm2 from "./pm2";
import Route from "./route";
import gatewayApiStatus from "./gateway-api-status";


let isConnected = false;
pm2.connect().then(() => isConnected = true);


export default (baseRoute, apps, middleware) => {
  baseRoute = Route.parse(baseRoute);
  const handlers = gatewayApiStatus(apps);

  const isRouteMatch = (req) => {
        const domain = req.get("host").split(":")[0];
        return baseRoute.domain === "*" || domain === baseRoute.domain;
      };

  // Register routes.
  const register = (verb, path, handler) => {
      path = `/${ baseRoute.path + path }`;
      middleware[verb](path, (req, res, next) => {
          isConnected
            ? isRouteMatch(req) ? handler(req, res) : next()
            : res.status(500).send({ isInitialized: false });
        });
    };
  const get = (path, handler) => register("get", path, handler);
  const post = (path, handler) => register("post", path, handler);

  get(":app", handlers.routeAppStatus);
  get("", handlers.routeStatuses);
};
