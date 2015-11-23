# app-sync

[![Build Status](https://travis-ci.org/philcockfield/app-sync.svg)](https://travis-ci.org/philcockfield/app-sync)

Pulls and runs node apps from Github, keeping them in sync with the remote repository using [Semantic Versioning](http://semver.org/).


## Setup

    npm install app-sync --save

If you are not using the module within it's Docker container, then ensure that [`pm2`](http://pm2.keymetrics.io/) is installed within it's runtime environment:

    npm install pm2 -g


## Docker Image
The `app-sync` module is designed to be run within a docker image which takes  environment variables describing each app/repository on github to run.

    docker pull philcockfield/app-sync

## Environment Variables
#### Main
Pass the following environment variables into the [docker container](https://hub.docker.com/r/philcockfield/app-sync/) to configure the host gateway application:

    GITHUB_TOKEN          # Auth token: https://github.com/settings/tokens
    GITHUB_USER_AGENT     # https://developer.github.com/v3/#user-agent-required
    TARGET_FOLDER         # The path where apps are downloaded to.
                          # NB: Use this if you need to change it to a shared container volume.


#### Applications
Apps are added with the `APP_<name>` prefix. Use the following configuration options:

    Required:
      --repo    # The <username/repo>. See 'Repo' section below.
      --route   # The route pattern to match. See 'Routes' section below.

    Optional:
      --branch  # The branch to pull from (default: 'master').

For example:

    APP_SITE: --repo philcockfield/app-sync --route */site --branch master

    APP_EXAMPLE_1: --repo philcockfield/app-sync/example/app-1 --route */app-1
    APP_EXAMPLE_2: --repo philcockfield/app-sync/example/app-2 --route */app-2



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

## Tutum
The setup sequence for creating an `app-sync` service on [Tutum](https://www.tutum.co/) is:

1. Services ⇨ Create Service

2. Image selection ⇨ Public repositories ⇨ `philcockfield/app-sync`

3. Service configuration ⇨ Run command ⇨ `npm start`

4. Main environment variables ([ref](https://github.com/philcockfield/app-sync#environment-variables)):
    - `NODE_ENV: production`
    - `GITHUB_TOKEN`
    - `GITHUB_USER_AGENT`
    - `TARGET_FOLDER: /opt/downloads` (or whatever volume you want to use)

5. Application environment variables ([ref](https://github.com/philcockfield/app-sync#environment-variables))

6. Add volume ⇨ Container path: `/opt/downloads` (leave host path blank)

7. Create and deploy.


## Application Port
Each application that runs within `app-sync` is assignd an automatically generated port via the `--port` start parameter.  Listen on this port for requests.  You may wish to use [minimist](https://www.npmjs.com/package/minimist) to extract the port value, for example:

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
