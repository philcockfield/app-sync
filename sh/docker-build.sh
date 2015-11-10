#!/usr/bin/env sh

# Build and tag image.
docker build -t philcockfield/app-sync .
docker tag -f philcockfield/app-sync philcockfield/app-sync:latest
