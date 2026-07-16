#!/bin/sh
set -e

mkdir -p /app/public/uploads
chown -R node:node /app/public

exec su-exec node "$@"
