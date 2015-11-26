import R from "ramda";
import Promise from "bluebird";
import pm2 from "./pm2";
import Route from "./route";
import gatewayApiStatus from "./gateway-api-status";

let isConnected = false;
pm2.connect().then(() => isConnected = true);




export default (baseRoute, apps, middleware) => {
  baseRoute = Route.parse(baseRoute);

  // Register routes.
  const get = (path, handler) => {
      path = `/${ baseRoute.path + path }`;
      middleware.get(path, (req, res, next) => {
          if (isConnected) {
            const domain = req.get("host").split(":")[0];
            if (baseRoute.domain === "*" || domain === baseRoute.domain) {
              handler(req, res);
            } else {
              next();
            }
          } else {
            res.status(500).send({ isInitialized: false });
          }
        });
    };

  const handlers = gatewayApiStatus(apps);
  get(":app", handlers.routeAppStatus);
  get("", handlers.routeStatuses);
};
