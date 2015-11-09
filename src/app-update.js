import Promise from "bluebird";
import log from "./log";


/**
 * Downloads a new version of the app (if necessary) and restarts it.
 */
export default (getVersion, restart) => {
  return new Promise((resolve, reject) => {

    const update = (version) => {
        log.info();
        log.info(`Updating '${ version.id }' from ${ version.local } to ${ version.remote }...`);
        restart({ download: true })
          .then(result => {
              log.info(`Updated '${ version.id }' to version ${ version.remote }.`);
              resolve({ updated: true, version: version.remote })
          })
          .catch(err => reject(err));
    };

    getVersion()
      .then(version => {
          if (version.updateRequired) {
            update(version);
          } else {
            resolve({ updated: false, version: version.local });
          }
      })
      .catch(err => reject(err));

  });
};
