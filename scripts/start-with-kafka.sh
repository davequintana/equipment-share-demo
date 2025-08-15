#!/bin/bash
# Complete startup script for the app with Kafka behavior tracking
# This script starts Docker services, sets up Kafka topics, starts development servers,
# and verifies everything is running correctly

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}🚀 Starting Full Development Environment with Kafka...${NC}"
echo ""

# Step 1: Start Docker services
echo -e "${BLUE}📦 Starting Docker services...${NC}"
if ! docker-compose up -d; then
    echo -e "${RED}❌ Failed to start Docker services${NC}"
    exit 1
fi

# Step 2: Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for Docker services to be ready...${NC}"
sleep 5

# Step 3: Setup Kafka topics
echo -e "${BLUE}🔧 Setting up Kafka topics...${NC}"
if [ -f "./setup-kafka-topics.sh" ]; then
    if ! ./setup-kafka-topics.sh; then
        echo -e "${YELLOW}⚠️  Kafka topics setup had issues, but continuing...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Kafka topics setup script not found, continuing...${NC}"
fi

# Step 4: Start development servers in background
echo -e "${BLUE}🖥️  Starting development servers...${NC}"
echo -e "${YELLOW}   This will start both the React app and Fastify API${NC}"
echo ""

# Use a trap to cleanup background processes when script exits
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start the development servers
pnpm run dev &
DEV_PID=$!

# Wait a bit for servers to start
echo -e "${YELLOW}⏳ Waiting for development servers to start...${NC}"
sleep 8

# Step 5: Verify everything is running
echo -e "${BLUE}🔍 Verifying services...${NC}"
if command -v node >/dev/null 2>&1; then
    node scripts/verify-startup.mjs
else
    echo -e "${YELLOW}⚠️  Node.js not found for verification, checking manually...${NC}"

    # Simple curl checks
    if curl -s http://localhost:4200 > /dev/null; then
        echo -e "${GREEN}✅ Web App - Running${NC}"
    else
        echo -e "${RED}❌ Web App - Not accessible${NC}"
    fi

    if curl -s http://localhost:3334/health > /dev/null; then
        echo -e "${GREEN}✅ Fastify API - Running${NC}"
    else
        echo -e "${RED}❌ Fastify API - Not accessible${NC}"
    fi

    if curl -s http://localhost:8080 > /dev/null; then
        echo -e "${GREEN}✅ Kafka UI - Running${NC}"
    else
        echo -e "${RED}❌ Kafka UI - Not accessible${NC}"
    fi
fi

echo ""
echo -e "${GREEN}${BOLD}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}📱 Open these URLs:${NC}"
echo -e "   • ${BOLD}Web App:${NC} http://localhost:4200"
echo -e "   • ${BOLD}API:${NC} http://localhost:3334"
echo -e "   • ${BOLD}Kafka UI:${NC} http://localhost:8080"
echo ""
echo -e "${BLUE}💡 User behavior tracking is active:${NC}"
echo -e "   • Mouse movements, clicks, and page views are tracked"
echo -e "   • Events are batched and sent to Kafka every 5 seconds"
echo -e "   • View events in Kafka UI under the 'user-activity' topic"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running to maintain the development servers
wait $DEV_PID
