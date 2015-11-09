import Promise from "bluebird";
import log from "./log";


/**
 * Downloads a new version of the app (if necessary) and restarts it.
 */
export default (id, getVersion, restart) => {
  return new Promise((resolve, reject) => {

    const update = (version) => {
        log.info();
        log.info(`Updating '${ id }' from ${ version.local } to ${ version.remote }...`);
        restart({ download: true })
          .then(result => {
              log.info(`Updated '${ id }' to version ${ version.remote }.`);
              resolve({ id, updated: true, version: version.remote })
          })
          .catch(err => reject(err));
    };

    getVersion()
      .then(version => {
          if (version.updateRequired) {
            update(version);
          } else {
            resolve({ id, updated: false, version: version.local });
          }
      })
      .catch(err => reject(err));

  });
};
