#!/bin/bash

# Post-build script for fastify-api deployment
# This script ensures workspace dependencies are available at runtime

set -e

# Build output directory
BUILD_DIR="dist/apps/fastify-api"

# Ensure build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory $BUILD_DIR not found"
  exit 1
fi

# Create node_modules directory
mkdir -p "$BUILD_DIR/node_modules"

# Copy secrets workspace package to node_modules
if [ -d "libs/secrets/dist" ]; then
  echo "Copying secrets workspace package..."
  cp -r "libs/secrets/dist" "$BUILD_DIR/node_modules/secrets"
  echo "Secrets package copied to $BUILD_DIR/node_modules/secrets"
else
  echo "Warning: libs/secrets/dist not found. Run 'nx build secrets' first."
  exit 1
fi

# Create a minimal package.json for the built app
cat > "$BUILD_DIR/package.json" << PACKAGE_EOF
{
  "name": "fastify-api",
  "version": "0.0.1",
  "type": "module", 
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  }
}
PACKAGE_EOF

echo "Deployment setup complete for fastify-api"
echo "The application can now be run with: cd $BUILD_DIR && npm start"
