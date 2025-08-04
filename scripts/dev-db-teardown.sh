#!/bin/bash

# Development database teardown script

set -e

echo "🛑 Tearing down development databases..."

# Stop and remove containers with volumes
echo "📦 Stopping PostgreSQL and Redis containers..."
docker-compose down -v

echo "🧹 Cleaning up Docker resources..."
docker system prune -f

echo "✅ Development databases have been cleaned up!"
echo "💡 Run 'scripts/dev-db-setup.sh' to set them up again"
