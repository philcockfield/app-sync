import Promise from "bluebird";
import log from "./log";



/**
 * Downloads a new version of the app (if necessary) and restarts it.
 */
export default (id, getVersion, getDownload, start, isRunning) => {
  return new Promise((resolve, reject) => {

    const done = (updated, restarted, version) => {
      if (updated) {
        const msg = restarted
            ? `...updated and restarted '${ id }' to v${ version }.`
            : `...updated '${ id }' to v${ version }.`
        log.info(msg);
      }
      resolve({ id, updated, version });
    };

    const update = (version) => {
        log.info();
        log.info(`Updating '${ id }' from v${ version.local } to v${ version.remote }...`);

        const restart = () => {
            start()
              .then(result => done(true, true, version.remote))
              .catch(err => reject(err));
          };

        getDownload()
          .then(result => {
              result = { id, updated: true, version: version.remote };
              if (isRunning) {
                restart()
              } else {
                done(true, false, version.remote);
              }
          })
          .catch(err => reject(err));
    };

    getVersion()
      .then(version => {
          if (version.updateRequired) {
            update(version);
          } else {
            done(false, false, version.local);
          }
      })
      .catch(err => reject(err));

  });
};
