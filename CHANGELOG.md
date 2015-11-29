# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).


## [Unreleased] - YYYY-MM-DD
#### Added
#### Changed
#### Deprecated
#### Removed
#### Fixed
#### Security


## [1.0.1] - 2015-11-30
#### Added
- Version of the `app-sync` module on API status.
#### Changed
- API as an object on manifest (eg. `api/route`).
  This allows for more details (like `tokens`) to be associated with the API within the manifest.


## [1.0.0] - 2015-11-29
#### Added
- Download and run registered apps from Github.
- Docker image: `docker pull philcockfield/app-sync` running from env-vars.
- Check PM2 is install globally.
- Gateway reverse proxies requests to running apps.

#### Changed
- Only running NPM install when absolutely required (faster).


## [0.0.2] - 2015-11-8
#### Added
- Setup configuration with Github tokens/user-agent and adding of apps with remote repository details.
- Downloading repository files from Github to local cache.
- Running downloaded app using [`pm2`](http://pm2.keymetrics.io/)
