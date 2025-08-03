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

# Step 3: Try to run a quick e2e test (first few tests only)
echo "Step 3: Running e2e tests..."
# Set environment similar to CI
export NODE_ENV=test
export CI=true

# Run a subset of tests to check if the server starts correctly
cd apps/e2e
pnpm exec playwright test --grep "should display welcome page" --timeout 10000

echo "CI simulation completed"
