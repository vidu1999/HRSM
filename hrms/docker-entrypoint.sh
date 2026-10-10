#!/bin/sh
set -e
# Apply schema migrations before the app starts serving traffic.
node_modules/.bin/tsx src/db/migrate.ts
exec "$@"
