import R from "ramda";
import pubsubFactory from "mq-pubsub";



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

  // Listen for events from the other containers.
  appUpdatedEvent.subscribe(payload => {
        if (payload.uid !== uid) {
          // The app was updated within another container, restart it now.
          const app = R.find(item => item.id === payload.data.id, apps)
          if (app) {
            app.start();
          }
        }
      });


  // Api.
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
        case "app:updated":
            appUpdatedEvent.publish({ uid, data });
            break;
        default: throw new Error(`The '${ event }' event is not supported.`);
      }
    }
  };

};
