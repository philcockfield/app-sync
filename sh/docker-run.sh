#!/usr/bin/env sh

docker run -t -p 80:3000 --env-file ./sh/env-vars -e GITHUB_TOKEN=$GITHUB_TOKEN app-sync npm start
