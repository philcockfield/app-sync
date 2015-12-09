var argv = require("minimist")(process.argv.slice(2));
import appSync from "../src/main";


// Initialize the module.
appSync({
  token: process.env.GITHUB_TOKEN,
  manifest: "philcockfield/app-sync/example/manifest.yml:devel"
})
.then(api => {

  // Start the gateway server.
  api.start({ port: argv.port })
    .catch(err => console.error("Error while starting:", err));

});
