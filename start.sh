#!/bin/sh

# Exit on error
set -e

echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done

echo "Running database migrations..."
pnpm drizzle-kit generate
pnpm drizzle-kit push

echo "Starting application..."
pnpm run dev 