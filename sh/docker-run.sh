#!/usr/bin/env sh

docker run -t -p 80:3000 --env-file ./sh/env-vars app-sync npm start
