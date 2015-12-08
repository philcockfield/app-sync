#!/usr/bin/env sh

    # --name app-sync \

docker run -t -p 80:3000 \
    -e GITHUB_TOKEN=$GITHUB_TOKEN \
    philcockfield/app-sync npm run example
