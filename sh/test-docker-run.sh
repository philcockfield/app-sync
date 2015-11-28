#!/usr/bin/env sh

    # --name app-sync \

docker run -t -p 80:3000 \
    --env-file ./sh/test-docker-run.vars \
    -e GITHUB_TOKEN=$GITHUB_TOKEN \
    philcockfield/app-sync npm run example
