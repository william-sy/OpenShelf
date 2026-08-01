#!/bin/sh
set -e

# /app/data and /app/uploads are usually Docker named volumes. A volume's
# on-disk ownership is whatever it had when it was first created - it is
# NOT re-applied from the image on every rebuild. If this volume was ever
# created/written while the container ran as root (e.g. before the image
# switched to a non-root user, or after restoring a backup as root), the
# "node" user below would get SQLITE_READONLY / EACCES trying to write to
# it. Fix ownership on every start, while still root, then drop privileges.
chown -R node:node /app/data /app/uploads

exec su-exec node "$@"
