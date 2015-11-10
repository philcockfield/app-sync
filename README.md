# app-sync
[![Build Status](https://travis-ci.org/philcockfield/app-sync.svg)](https://travis-ci.org/philcockfield/app-sync)

Pulls and runs node apps from Github, keeping them in sync with the remote repository using [Semantic Versioning](http://semver.org/).


## Setup

    npm install app-sync --save

If you are not using the module within it's Docker container, then ensure that [`pm2`](http://pm2.keymetrics.io/) is installed within it's runtime environment:

    npm install pm2 -g


## Docker Image
The `app-sync` module is designed to be run within a docker image which takes  environment variables describing each app/repo on github to run.

    docker pull philcockfield/app-sync

## Environment Variables
Pass the following environment variables into the [docker container](https://hub.docker.com/r/philcockfield/app-sync/) to configure the host gateway application:

    GITHUB_TOKEN          # Auth token: https://github.com/settings/tokens
    GITHUB_USER_AGENT     # Used as the github API user-agent.


Apps are added with the `APP_<name>` prefix.

Use the following configuration options:

    Required:
      --repo    # The <username/repo>. See 'Repo' section below.
      --route   # The route pattern to match. See 'Routes' section below.

    Optional:
      --branch  # The branch to pull from (default: 'master').

For example:

    APP_SITE:"--repo philcockfield/app-sync --route */site --branch master"



#### Repo
The `--repo` field must be fully qualified Github repository including the user-name. Optionally include a sub-path to a location within repository where the node-app exists. The repository must have a `package.json` file in the root:


    --repo philcockfield/my-repo
    --repo philcockfield/my-repo/sub-folder/site



#### Route
The `--route` field describes a URL pattern to match for the app.  The pattern takes the form of `<domain>/<path>`.  Use a wildcard (`*`) to match any domain. For example:

    www.domain.com
    api.domain.com
    domain.com/path
    */path
    *


## App Ports
Each application that is run within `app-sync` is given an automatically generated port via the `--port` start parameter.  Listen on this port for requests, for example:

```js
var argv = require("minimist")(process.argv.slice(2));
app.listen(argv.port);
```






## Run Example
    npm install
    npm run example


## Tests
    npm test


---
### License: MIT
