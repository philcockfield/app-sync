# app-sync

[![Build Status](https://travis-ci.org/philcockfield/app-sync.svg)](https://travis-ci.org/philcockfield/app-sync)

**Continuous deployment from Github.**  This module downloads and runs node apps from Github, keeping them in sync with the remote repository based on [Semantic Versioning](http://semver.org/).


![Diagram](https://cloud.githubusercontent.com/assets/185555/11834849/e4a58274-a434-11e5-85b7-258f91182f69.png)



## Setup

    npm install --save app-sync

If you are not using the module within it's Docker container, then ensure that [`pm2`](http://pm2.keymetrics.io/) is installed within it's runtime environment:

    npm install pm2 -g


## Docker Image
The `app-sync` module is designed to be run within its [docker image](https://hub.docker.com/r/philcockfield/app-sync/) which takes a few environment variables for connecting to Github, and then a pointer to a `manifest.yml` on Github that defines the apps to run within it.

    docker pull philcockfield/app-sync

## Environment Variables
#### Main
Pass the following environment variables into the [docker container](https://hub.docker.com/r/philcockfield/app-sync/) to configure the host gateway application:

    Required:
        GITHUB_TOKEN          # Auth token: https://github.com/settings/tokens
        GITHUB_USER_AGENT     # https://developer.github.com/v3/#user-agent-required
        MANIFEST              # <user/repo>/path/manifest.yml:<branch>


    Optional:
        RABBIT_MQ             # URL to the RabbitMQ/AMQP server.



#### Manifest
The `MANIFEST` points to a YAML file that declares global configuration settings along with the node applications to run.  The YAML files takes for form of:

```yaml
targetFolder: "/opt/downloads"    # Optional
api:                              # Optional
  route: <domain>/<path>
  tokens: [<token>, <token>, ...] # Optional
apps:
  <id>:
    repo: "<user>/<repo>/path-1"
    route: "*"
    branch: "devel"
  bar:
    repo: "philcockfield/app-sync/example/app-1"
    route: "*/bar"
```

- The optional `targetFolder` specifies where apps are downloaded to.
    - If omitted a default path is used.
    - Use this if you need to change it to a shared container volume.
      This is more efficient when load-balancing across multiple containers as each container shares the single app download.
- The optional `rabbitMQ` is the URL to a [RabbitMQ](https://www.rabbitmq.com/) server used to communicate between multiple instances of the module running within different containers.
- The optional `api` contains details about the REST-API.
    - If omitted the API is not exposed.
    - `route`: The base route that the API is exposed upon, for example: `*/api`
    - `tokens`: An optional array of passwords to lock the API with. Pass the `token` in the query string.
- If the `branch` of an app is omitted the default of `master` is used.




#### Repo
The `repo:` field must be a fully qualified Github repository including the user-name. Optionally you can include a path to a location within the repository where the node-app exists. The repository or folder that is pointed to must have a `package.json` file within it:


    philcockfield/my-repo
    philcockfield/my-repo/sub-folder/site



#### Route
The `route:` field describes a URL pattern to match for the app.  The pattern takes the form of `<domain>/<path>`.  Use a wildcard (`*`) to match any incoming domain. For example:

    www.domain.com
    api.domain.com
    domain.com/path
    */path
    *




## Application Port
Each application that runs within `app-sync` is assigned an automatically generated port that is passed in via the `--port` startup parameter.  Listen on this port for requests.  You may wish to use [minimist](https://www.npmjs.com/package/minimist) to extract the port value, for example:

```js
var argv = require("minimist")(process.argv.slice(2));
app.listen(argv.port);
```




## REST API
If you have set the `api/route` field set within the `MANIFEST` the following API is available:

    GET:  /api/                         # Status of all running apps
    GET:  /api/apps/:appId              # Status of the specified app.
    GET:  /api/apps/:appId/restart      # Restarts the specified app.
    GET:  /api/apps/:appId/update       # Updates the specified app.
    POST: /api/github                   # "Push" web-hook from Github repositories.

If you have `api/tokens` within your `manifest.yml` ensure your API url's have an `?token=<value>` query-string.



## Github Webhook
Commits to application repositories are monitored via [Github webhooks](https://developer.github.com/webhooks/).  If the commit is on the registered branch, and the package version number has increased the app is downloaded and restarted.

#### Setup
1. Ensure the `api/route:` field has been set in the manifest YAML so that the API is exposed.
2. Within the Github repository settings, select `Webhooks & Services` and click `Add Webhook`
3. Settings:
    - Payload URL: `<api-route>/github` for example: `https://foo.com/api/github`
    - Content type: `application/json`





## Tutum
To create an `app-sync` service on [Tutum](https://www.tutum.co/):

1. Services ⇨ Create Service
2. Image selection ⇨ Public repositories ⇨ `philcockfield/app-sync`
4. Add environment variables ([ref](https://github.com/philcockfield/app-sync#main)):
    - `NODE_ENV: production`
    - `GITHUB_TOKEN`
    - `GITHUB_USER_AGENT`
    - `MANIFEST`
5. Optional. Add volume ⇨ Container path: `/opt/downloads` (leave host path blank).  This value should be declared within the manifest.
6. Create and deploy.




## Run Example

    npm install
    npm run example

To simulate a multi-container deployment ensure the `rabbitMQ` server URL is declared.  You can do this by setting the `RABBIT_MQ` environment variable, or point to a `manifest.yml` where the `rabbitMQ` field is set.

In one console run:

    npm run example1  

then in a second console, run:

    npm run example2

To simulate a change, update and checkin the `package.json` version of either of the example apps (`app-1` or `app-2`).







## Tests
    npm test


---
### License: MIT
