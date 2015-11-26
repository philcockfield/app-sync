import R from "ramda";
import Promise from "bluebird";


/**
 * Handles web-hook calls from Github.
 */
export default (app) => {



  return {
    postPush(req, res) {
      console.log("req.url", req.url);
      console.log("req.body", req.body);

    }
  };
};
