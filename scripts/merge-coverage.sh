#!/bin/bash

# Merge LCOV files for SonarCloud
echo "Merging LCOV coverage files for SonarCloud..."

# Create coverage directory if it doesn't exist
mkdir -p coverage

# Check if lcov-result-merger is available, if not try with cat
if command -v lcov-result-merger >/dev/null 2>&1; then
    echo "Using lcov-result-merger to merge coverage files..."
    lcov-result-merger 'coverage/apps/*/lcov.info' coverage/lcov.info
elif command -v lcov >/dev/null 2>&1; then
    echo "Using lcov to combine coverage files..."
    lcov --add-tracefile coverage/apps/web-app/lcov.info \
         --add-tracefile coverage/apps/fastify-api/lcov.info \
         --output-file coverage/lcov.info 2>/dev/null || {
        echo "lcov command failed, falling back to simple concatenation..."
        cat coverage/apps/web-app/lcov.info coverage/apps/fastify-api/lcov.info > coverage/lcov.info
    }
else
    echo "Using simple concatenation to merge coverage files..."
    # Simple merge by concatenating files
    {
        cat coverage/apps/web-app/lcov.info
        echo ""
        cat coverage/apps/fastify-api/lcov.info
    } > coverage/lcov.info
fi

echo "Coverage merge complete. Files available:"
find coverage -name "*.info" -exec wc -l {} \;

echo "SonarCloud coverage setup ready!"
