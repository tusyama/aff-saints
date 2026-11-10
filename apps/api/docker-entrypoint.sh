#!/bin/sh
set -eu
cd /app/apps/api
bunx prisma migrate deploy
bun prisma/seed.ts
exec bun dist/main.js
