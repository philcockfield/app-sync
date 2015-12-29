var argv = require("minimist")(process.argv.slice(2));
import appSync from "../src/main";


// Initialize the module.
appSync({
  token: process.env.GITHUB_TOKEN,
  rabbitMQ: "amqp://rabbitmq",
  manifest: "philcockfield/app-sync/example/manifest.yml:devel"
  // manifest: "philcockfield/sites/manifest.yml"
})
.then(api => {

  // Start the gateway server.
  api.start({ port: argv.port })
    .catch(err => console.error("Error while starting:", err));

});
