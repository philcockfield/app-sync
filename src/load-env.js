import R from "ramda";
import minimist from "minimist";
import appSync from "./index";
import log from "./log";


// Check for required variables.
if (!process.env.GITHUB_TOKEN) {
  log.warn(`WARNING - a Github authentication token has not been specified.`);
  log.warn(`See: https://github.com/settings/tokens`);
  log.warn(`example:`);
  log.warn(`   export GITHUB_TOKEN="..."`);
  log.warn("-------------------------------------------");
  log.warn();
}
if (!process.env.GITHUB_USER_AGENT) {
  log.warn(`WARNING - a Github user-agent has not been specified.`);
  log.warn(`See: https://developer.github.com/v3/#user-agent-required`);
  log.warn(`example:`);
  log.warn(`   export GITHUB_USER_AGENT="my-app-name"`);
  log.warn("-------------------------------------------");
  log.warn();
}





// Create gateway.
const gateway = appSync({
  token: process.env.GITHUB_TOKEN,
  userAgent: process.env.GITHUB_USER_AGENT
});




// Regsiter apps.
Object.keys(process.env).forEach(key => {
      if (key.startsWith("APP_")) {
        const value = process.env[key];
        const args = minimist(value.split(" "));
        const { repo, route, branch } = args;
        gateway.add(key, repo, route, { branch });
      }
    });



// Start the gateway.
gateway.start().catch(err => log.error("Failed to start gateway:", err));
