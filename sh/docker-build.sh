#!/usr/bin/env sh

# Build and tag image.
docker build -t app-sync .
docker tag -f app-sync philcockfield/app-sync:latest
