import R from "ramda";
import pubsubFactory from "mq-pubsub";
import log from "./log";



/**
 * Handles the pub/sub events used to communicate between multiple instances
 * of app-sync running within different containers.
 *
 * @param {String}  uid:    The unique identifier of the main app-sync instance.
 * @param {Array}   apps:   The array containing the collection of apps.
 * @param {String}  url:    The URL to the RabbitMQ server.
 *
 * @return {Object} The internal pub/sub API.
 */
export default (uid, apps, url) => {
  // Setup initial conditions.
  if (!url) { throw new Error("A URL to the RabbitMQ server is required."); }

  // Setup the pub/sub event.
  const pubsub = pubsubFactory(url);
  const appUpdatedEvent = pubsub.event("app:updated");
  const appRestartedEvent = pubsub.event("app:restarted");
  const manifestUpdatedEvent = pubsub.event("manifest:updated");

  // Log that connection is ready.
  pubsub.ready()
    .then(result => log.info(`Connected to RabbitMQ on '${ url }'\n`))
    .catch(err => {
        log.error(`Failed to connect to RabbitMQ on ${ url }`);
        log.error(" - code:", err.code);
        log.error(" - ip-address:", `${ err.address }:${ err.port }`);
        log.error("");
    });


  const getApp = (payload) => {
        if (payload.uid !== uid) {
          return R.find(item => item.id === payload.data.id, apps);
        }
      };

  const catchSubscribeError = (title, err) => {
        if (err.code !== "ECONNREFUSED") { log.error(`${ title } Event -`, err) };
      };

  // Listen for events from the other containers.
  appUpdatedEvent.subscribe(payload => {
        const app = getApp(payload);
        if (app) {
          console.log(`App '${ app.id }' updated in another container - restarting it now...`);
          app.start();
        }
      })
      .catch(err => catchSubscribeError("App Updated", err));


  appRestartedEvent.subscribe(payload => {
        // The app was restarted within another container, restart it now.
        const app = getApp(payload);
        if (app) {
          console.log(`App '${ app.id }' restarted in another container - restarting it now...`);
          app.start();
        }
      })
      .catch(err => catchSubscribeError("App Restarted", err));


  manifestUpdatedEvent.subscribe(payload => {
        // The manifest changed, restart all apps.
        console.log(`The manifest.yml changed in another container - restarting all apps now...`);
        apps.forEach(app => {
          app.start();
        });
      })
      .catch(err => catchSubscribeError("App Restarted", err));



  // API.
  return {
    /**
     * Publishes an event that all app-sync instances the
     * running containers will hear.
     *
     * @param {String} event: The name of the event to fire.
     * @param {object} data:  The event details.
     *
     */
    publish(event, data) {
      switch (event) {
        case "app:updated": appUpdatedEvent.publish({ uid, data }); break;
        case "app:restarted": appRestartedEvent.publish({ uid, data }); break;
        case "manifest:updated": manifestUpdatedEvent.publish({ uid, data }); break;

        default: throw new Error(`The '${ event }' event is not supported.`);
      }
    }
  };

};
