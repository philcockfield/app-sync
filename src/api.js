import R from "ramda";
import pm2 from "./pm2";
import Route from "./route";
import apiStatus from "./api-status";
import apiWebhook from "./api-webhook";
import apiActions from "./api-actions";

import log from "./log";


let isConnected = false;
pm2.connect().then(() => isConnected = true);


/**
 * The API to the gateway service.
 *
 * @param {Object} settings:
 *                  - apps:         Collection of apps to start.
 *                  - middleware:   The express middleware.
 *                  - manifest:     A manifest object.
 *                  - apiRoute:     The base URL to the API.
  *                 - publishEvent: Function that publishes an event across all containers (via RabbitMQ).
*
 */
export default (settings = {}) => {
  const { apiRoute, apps, middleware, manifest, publishEvent } = settings;
  const baseRoute = Route.parse(apiRoute);
  const status = apiStatus({ apps });
  const webhook = apiWebhook({ apps, manifest });

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
  get("apps/:app", status.getAppStatus);
  // get("apps/:app/restart", status.getAppStatus);
  get("", status.getStatuses);
  post("repo", webhook.post);
  log.info("");
};
