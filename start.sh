#!/bin/sh

# Exit on error
set -e

while ! nc -z db 5432; do sleep 1; done &&
PGPASSWORD=postgres psql -h db -U postgres -c 'DROP DATABASE IF EXISTS kaspa_kasino;' &&
PGPASSWORD=postgres psql -h db -U postgres -c 'CREATE DATABASE kaspa_kasino;' &&
pnpm config set store-dir /app/.pnpm-store &&
pnpm install &&
pnpm drizzle-kit generate &&
pnpm drizzle-kit push &&
pnpm run dev
