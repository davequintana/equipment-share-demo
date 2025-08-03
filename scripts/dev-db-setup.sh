#!/bin/bash

# Development database setup script

set -e

echo "🔄 Setting up development databases..."

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose up postgres redis -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U enterprise -d enterprise_db; do
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec redis redis-cli ping; do
  sleep 2
done

echo "✅ Redis is ready!"

# Show connection information
echo ""
echo "🎯 Database Connection Information:"
echo "📊 PostgreSQL:"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: enterprise_db"
echo "   - Username: enterprise"
echo "   - Password: password"
echo "   - URL: postgresql://enterprise:password@localhost:5432/enterprise_db"
echo ""
echo "🔴 Redis:"
echo "   - Host: localhost"
echo "   - Port: 6379"
echo "   - URL: redis://localhost:6379"
echo ""
echo "🚀 Development databases are ready!"
echo "💡 Run 'pnpm run dev' to start the application"
