import Promise from "bluebird";
import log from "./log";



/**
 * Downloads a new version of the app (if necessary) and restarts it.
 * @param {String} id: The unique identifier of the app.
 * @param {Function} getVersion: Function that gets the version details.
 * @param {Function} getDownload: Function that initiates a download.
 * @param {Function} start: Function that starts the application.
 * @param options
 *          - start: Flag indicating if the app should be started after an update.
     *               Default: true.
 */
export default (id, getVersion, getDownload, start, options = {}) => {
  const restartAfterUpdate = options.start === undefined ? true : options.start;

  return new Promise((resolve, reject) => {
    const done = (updated, restarted, version) => {
        if (updated) {
          const msg = restarted
              ? `...updated and restarted '${ id }' to v${ version }.`
              : `...updated '${ id }' to v${ version }.`
          log.info("");
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
              if (restartAfterUpdate) {
                restart()
              } else {
                done(true, false, version.remote);
              }
          })
          .catch(err => reject(err));
    };

    getVersion()
      .then(version => {
          if (version.isUpdateRequired && !version.isDownloading) {
            update(version);
          } else {
            done(false, false, version.local);
          }
      })
      .catch(err => reject(err));

  });
};
