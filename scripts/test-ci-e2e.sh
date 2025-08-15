#!/bin/bash

# CI Simulation Script for E2E Tests
# This script simulates the GitHub Actions CI environment for local testing

set -e

echo "🚀 Simulating CI environment for E2E tests..."

# Set CI environment variables
export CI=true
export NODE_ENV=test
export JWT_SECRET=test-secret-key
export PLAYWRIGHT_WORKERS=2
export DEBUG=pw:webserver

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build projects
echo "🔨 Building projects..."
pnpm exec nx run-many -t build --projects=web-app,fastify-api --parallel

# Debug environment
echo "🔍 Environment debug info:"
echo "Node version: $(node --version)"
echo "PNPM version: $(pnpm --version)"
echo "CI environment: $CI"
echo "NODE_ENV: $NODE_ENV"
echo "PWD: $(pwd)"
echo "Built files:"
ls -la dist/ 2>/dev/null || echo "No dist directory found"

# Run E2E tests with CI settings
echo "🧪 Running E2E tests in CI mode..."
cd apps/e2e
npx playwright test --verbose

echo "✅ CI simulation complete!"
