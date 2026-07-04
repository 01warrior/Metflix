#!/usr/bin/env bash
set -e

echo "=== MetFlix Setup ==="

# Create db directory if it doesn't exist
mkdir -p db

# Push schema & generate client
npx prisma db push

# Seed with demo content
npx prisma db seed

echo "=== Done ==="
echo "Run 'npm run dev' or 'npm run start' to launch."
