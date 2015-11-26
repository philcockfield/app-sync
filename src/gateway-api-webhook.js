import R from "ramda";
import Promise from "bluebird";
import log from "./log";


/**
 * Handles web-hook calls from Github.
 */
export default (apps) => {
  return {
    post(req, res) {
      // Extract data.
      const data = req.body;
      const branch = (data.ref && R.last(data.ref.split("/"))) || data.repository.default_branch;
      const repo = data.repository.full_name;

      // Match apps that reside within the repo that Github posted.
      const isRepoMatch = (app) => app.repo.name === repo && app.branch === branch;
      const matchingApps = R.filter(isRepoMatch, apps);

      // Update any matching apps.
      if (matchingApps.length > 0) {
        log.info(`Github webhook for '${ repo }:${ branch }' => Checking for updates: ${ matchingApps.map(item => item.id) }`);
        matchingApps.forEach(app => app.update());
      }

      // Finish up.
      res.status(200).send();
    }
  };
};
