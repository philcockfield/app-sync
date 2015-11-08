import R from "ramda";
import { isEmpty } from "./util";


const formatMatchValue = (value) => isEmpty(value)
                                        ? undefined
                                        : value.trim();



/**
 * Provides an informational facets of a route.
 */
const parse = (route) => {
  // Setup initial conditions.
  if (isEmpty(route)) { throw new Error("A route string must be specified."); }
  const parts = route.split("/");

  // Domain.
  const domain = parts[0].trim();

  // URL path.
  let path = R.takeLast(parts.length - 1, parts).join("/").trim();
  path = isEmpty(path) ? undefined : path;

  return {
    domain,
    path,

    /**
     * Determines whether the domain/path values match the route.
     * @param {string} domain: The domain name to match.
     * @param {string} path:   The URL path to match.
     * @return {Boolean}
     */
    match(domain, path) {
      domain = formatMatchValue(domain);
      path = formatMatchValue(path);
      const isWildcardDomain = this.domain === "*";

      if (!isWildcardDomain) {
        if (domain !== this.domain) { return false; }
      }

      if (this.path) {
        if (!path) { return false; }
        if (path && !path.startsWith(this.path)) { return false; }
      }

      // Finish up.
      return true;
    }
  };
};




export default { parse };
