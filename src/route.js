import R from "ramda";
import { isEmpty } from "./util";


const formatMatchValue = (value) => isEmpty(value)
                                        ? undefined
                                        : value.trim();




/**
 * Provides an informational facet of a route.
 */
const parse = (route) => {
  // Setup initial conditions.
  if (isEmpty(route)) { throw new Error("A route string must be specified."); }
  const parts = route.split("/");

  // URL path.
  let urlPath = R.takeLast(parts.length - 1, parts).join("/").trim();
  urlPath = isEmpty(urlPath) ? undefined : urlPath;
  if (urlPath) {
    urlPath = urlPath.endsWith("/") ? urlPath : urlPath + "/";
  }

  return {
    domain: parts[0].trim(),
    path: urlPath,

    /**
     * Determines whether the domain/path values match the route.
     * @param {string} domain: The domain name to match.
     * @param {string} path:   The URL path to match.
     * @return {Boolean}
     */
    match(domain, path) {
      domain = formatMatchValue(domain);
      path = formatMatchValue(path);
      if (path) { path = path.replace(/^\//, ""); }
      const isWildcardDomain = this.domain === "*";
      const isWildcardPath = this.path === "*";

      if (!isWildcardDomain) {
        if (domain !== this.domain) { return false; }
      }

      if (this.path) {
        if (!path) { return false; }
        if (!isWildcardPath && path && !(path + "/").startsWith(this.path)) { return false; }
      }

      if (!this.path && path) {
        return false;
      }

      // Finish up.
      return true;
    },


    /**
     * Retrieves a string representation of the route,
     */
    toString() {
      return `${ this.domain }/${ this.path || "" }`.replace(/\/$/, "");
    }
  };
};



/**
 * Parses all routes within the given value(s).
 * @param {String|Array} route: The Route or Routes to parse.
 * @return {Array}.
 */
const parseAll = (route) => {
  if (!R.is(Array, route)) { route = [route]; }
  return R.map(parse, route);
};




export default { parse, parseAll };
