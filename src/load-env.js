import R from "ramda";
import fsPath from "path";
import minimist from "minimist";
import appSync from "./main";
import log from "./log";

const { GITHUB_TOKEN, GITHUB_USER_AGENT, TARGET_FOLDER } = process.env;

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





// Create gateway.
const gateway = appSync({
  token: GITHUB_TOKEN,
  userAgent: GITHUB_USER_AGENT,
  targetFolder: TARGET_FOLDER
});


log.info(`Apps downloaded to: ${ fsPath.resolve(gateway.targetFolder) }`);


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
