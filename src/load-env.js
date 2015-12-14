import fsPath from "path";
import appSync from "./main";
import log from "./log";

const { GITHUB_TOKEN, GITHUB_USER_AGENT, MANIFEST, RABBIT_MQ } = process.env;


// Check for required variables.
if (!GITHUB_TOKEN) {
  log.warn(`WARNING - a Github authentication token has not been specified.`);
  log.warn(`See: https://github.com/settings/tokens`);
  log.warn(`example:`);
  log.warn(`   export GITHUB_TOKEN="..."`);
  log.warn("-------------------------------------------");
  log.warn();
}
if (!GITHUB_USER_AGENT) {
  log.warn(`WARNING - a Github user-agent has not been specified.`);
  log.warn(`See: https://developer.github.com/v3/#user-agent-required`);
  log.warn(`example:`);
  log.warn(`   export GITHUB_USER_AGENT="my-app-name"`);
  log.warn("-------------------------------------------");
  log.warn();
}
if (!MANIFEST) {
  log.warn(`WARNING - a manifest YAML file has not been specified.`);
  log.warn(`example:`);
  log.warn(`   export MANIFEST="username/my-repo/manifest.yml"`);
  log.warn("-------------------------------------------");
}


// Create gateway.
appSync({
  token: GITHUB_TOKEN,
  userAgent: GITHUB_USER_AGENT,
  manifest: MANIFEST,
  rabbitMQ: RABBIT_MQ
})
.then(gateway => {

    // Start the gateway server.
    log.info(`Apps downloaded to: ${ fsPath.resolve(gateway.targetFolder) }`);
    gateway
      .start()
      .catch(err => log.error("Failed to start gateway:", err));

})
.catch(err => log.error("Failed while creating gateway:", err.message));
