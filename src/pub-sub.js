import R from "ramda";
import amqp from "amqplib/callback_api";
import Promise from "bluebird";
const EXCHANGE = "app-state";


const init = (url, exchange) => {
      return new Promise((resolve, reject) => {
        amqp.connect(url, (err, connection) => {
          if (err) {
            reject(err)
          } else {
            connection.createChannel((err, channel) => {
              channel.assertExchange(exchange, "fanout", { durable: false });
              resolve({ channel });
            });
          }
        });
      });
    };


const listen = (channel, exchange, onMessage) => {
      channel.assertQueue("", { exchangeclusive: true }, function(err, q) {
        channel.bindQueue(q.queue, exchange, "");
        channel.consume(q.queue, onMessage, { noAck: true });
      });
    };



/**
 * Handles the pub/sub events used to communicate between multiple instances
 * of app-sync running within different containers.
 * @param {string} uid: The unique identifier of the main app-sync instance.
 * @param {array} apps: The array containing the collection of apps.
 * @param {string} url: The URL to the RabbitMQ server.
 */
export default (uid, apps, url) => {
  let channel;

  Promise.coroutine(function*() {
    // Setup initial conditions.
    if (!url) { throw new Error("A URL to the RabbitMQ server is required."); }

    // Connect to the RabbitMQ server.
    channel = (yield init(url, EXCHANGE)).channel;

    // Listen for events from other containers..
    listen(channel, EXCHANGE, (msg) => {
      const payload = JSON.parse(msg.content.toString());
      if (payload.uid !== uid) {

        console.log("payload.uid", payload.uid);
        console.log("payload.data", payload.data);
        console.log("TODO - restart the corresponding app on event 'app:updated'");
        console.log("");

      }
    });
  }).call(this);


  // Api.
  return {
    /**
     * Publishes an event that all app-sync instances the
     * running containers will hear.
     * @param {object} data: The event details.
     */
    publish(event, data) {
      if (channel) {
        const payload = JSON.stringify({ uid, event, data });
        channel.publish(EXCHANGE, "", new Buffer(payload));
      }
    }
  };

};
