#!/usr/bin/env sh


# ------------------------------------------------------------------------------
# General settings
# ------------------------------------------------------------------------------
export GITHUB_TOKEN=$GITHUB_TOKEN
export GITHUB_USER_AGENT="test-env"
export TARGET_FOLDER="./.build-foo"

# ------------------------------------------------------------------------------
# Apps
# ------------------------------------------------------------------------------
export APP_ONE="--repo philcockfield/app-sync/example/app-1 --route */foo --branch devel"
export APP_TWO="--repo philcockfield/app-sync/example/app-2 --route * --branch devel"



# ------------------------------------------------------------------------------
# Run
# ------------------------------------------------------------------------------
node ./lib/load-env
