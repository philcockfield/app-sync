#!/usr/bin/env sh

docker run -t -p 80:3000 \
    --name app-sync \
    --env-file ./sh/test-docker-run.vars \
    -e GITHUB_TOKEN=$GITHUB_TOKEN \
    philcockfield/app-sync npm start
