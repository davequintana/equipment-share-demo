#!/bin/bash

# Test script to simulate CI environment

echo "Simulating CI build and test process..."

# Step 1: Build the projects (like CI does)
echo "Step 1: Building projects..."
pnpm exec nx run-many -t build --projects=web-app,fastify-api --parallel

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build completed successfully"

# Step 2: List what was built
echo "Step 2: Checking build outputs..."
ls -la dist/apps/web-app/
ls -la dist/apps/fastify-api/

# Step 3: Try to run all e2e tests
echo "Step 3: Running e2e tests..."
# Set environment similar to CI
export NODE_ENV=test
export CI=true

# Run all tests from the e2e directory to avoid vitest workspace conflicts
cd apps/e2e
npx playwright test --project=chromium

echo "CI simulation completed"
