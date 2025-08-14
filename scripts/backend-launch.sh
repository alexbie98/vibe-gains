#!/bin/bash

# Vibe Gains Backend Launch Script
# Usage: ./launch.sh [mode]
# Modes: dev (default), prod, test

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default mode
MODE="${1:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
}

echo -e "${BLUE}🚀 Vibe Gains Backend Launcher${NC}"
echo "=================================="
echo "Mode: $MODE"
echo ""

# Dependency checks
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are available${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check if port 3001 is already in use
if port_in_use 3001; then
    echo -e "${YELLOW}⚠️  Port 3001 is already in use${NC}"
    echo "You may need to stop the existing process first."
    echo ""
fi

# Create data directory if it doesn't exist
if [ ! -d "$PROJECT_ROOT/data" ]; then
    echo -e "${YELLOW}📁 Creating data directory...${NC}"
    mkdir -p "$PROJECT_ROOT/data"
fi

case $MODE in
    "dev")
        echo -e "${YELLOW}🛠️  Starting development server...${NC}"
        echo "Backend will run on: http://localhost:3001"
        echo "API endpoints: http://localhost:3001/api"
        echo "API docs: http://localhost:3001/api-docs"
        echo "Health check: http://localhost:3001/health"
        echo ""
        echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
        echo ""
        npm run dev
        ;;
    
    "prod")
        echo -e "${YELLOW}🏗️  Building for production...${NC}"
        npm run build
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Build completed successfully${NC}"
            echo -e "${YELLOW}🚀 Starting production server...${NC}"
            echo "Backend will run on: http://localhost:3001"
            echo ""
            npm start
        else
            echo -e "${RED}❌ Build failed${NC}"
            exit 1
        fi
        ;;
    
    "test")
        echo -e "${YELLOW}🧪 Running comprehensive API tests...${NC}"
        echo ""
        
        # Check if server is running
        if ! port_in_use 3001; then
            echo -e "${RED}❌ Backend server is not running on port 3001${NC}"
            echo "Please start the server first with: ./launch.sh dev"
            exit 1
        fi
        
        # Run the comprehensive test suite
        if [ -f "test-api.sh" ]; then
            ./test-api.sh
        else
            echo -e "${YELLOW}⚠️  Comprehensive test script not found${NC}"
            echo "Running basic health check instead..."
            curl -s http://localhost:3001/health | jq '.' || echo "Health check failed"
        fi
        ;;
    
    *)
        echo -e "${RED}❌ Invalid mode: $MODE${NC}"
        echo ""
        echo "Available modes:"
        echo "  dev  - Start development server with hot reload"
        echo "  prod - Build and start production server"
        echo "  test - Run API test suite (requires running server)"
        echo ""
        echo "Usage: ./launch.sh [mode]"
        exit 1
        ;;
esac