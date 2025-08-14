#!/bin/bash

# Lift Tracker Full Stack Launch Script
# Usage: ./launch.sh [mode]
# Modes: dev (default), frontend, backend, prod, test, clear-data

set -e  # Exit on any error

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

echo -e "${BLUE}🚀 Lift Tracker Full Stack Launcher${NC}"
echo "===================================="
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

case $MODE in
    "dev")
        echo -e "${YELLOW}🛠️  Starting full development environment...${NC}"
        echo ""
        
        # Check ports
        if port_in_use 3000; then
            echo -e "${YELLOW}⚠️  Port 3000 (frontend) is already in use${NC}"
        fi
        if port_in_use 3001; then
            echo -e "${YELLOW}⚠️  Port 3001 (backend) is already in use${NC}"
        fi
        
        # Install dependencies
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        cd ../backend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        cd ../frontend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        cd ../scripts
        
        echo -e "${YELLOW}🔧 Building backend...${NC}"
        cd ../backend && npm run build && cd ../scripts
        
        echo -e "${YELLOW}🌟 Starting development servers...${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:3001/api"
        echo "API docs: http://localhost:3001/api-docs"
        echo ""
        echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
        echo ""
        
        # Start backend in background
        cd ../backend && npm run dev &
        BACKEND_PID=$!
        
        # Wait for backend to start
        sleep 3
        
        # Start frontend
        cd ../frontend && npm start &
        FRONTEND_PID=$!
        
        # Cleanup function
        cleanup() {
            echo ""
            echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            kill $FRONTEND_PID 2>/dev/null || true
            exit 0
        }
        
        trap cleanup SIGINT SIGTERM
        wait $BACKEND_PID $FRONTEND_PID
        ;;
    
    "frontend")
        echo -e "${YELLOW}🎨 Starting frontend development server...${NC}"
        cd ../frontend
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm start
        ;;
    
    "backend")
        echo -e "${YELLOW}⚙️  Starting backend development server...${NC}"
        cd ../backend
        ../scripts/backend-launch.sh dev
        ;;
    
    "prod")
        echo -e "${YELLOW}🏗️  Building for production...${NC}"
        
        # Build backend
        cd ../backend
        npm run build
        cd ../scripts
        
        # Build frontend
        cd ../frontend
        npm run build
        cd ../scripts
        
        echo -e "${GREEN}✅ Production build completed${NC}"
        echo "Built files:"
        echo "  Backend: backend/dist/"
        echo "  Frontend: frontend/build/"
        echo ""
        echo "To start production servers:"
        echo "  Backend: cd backend && npm start"
        echo "  Frontend: Serve frontend/build/ with a web server"
        ;;
    
    "test")
        echo -e "${YELLOW}🧪 Running API tests...${NC}"
        cd ../backend
        ../scripts/backend-launch.sh test
        ;;
    
    "clear-data")
        echo -e "${YELLOW}🗑️  Clearing database...${NC}"
        ../scripts/clear-data.sh
        ;;
    
    *)
        echo -e "${RED}❌ Invalid mode: $MODE${NC}"
        echo ""
        echo "Available modes:"
        echo "  dev        - Start both frontend and backend in development mode"
        echo "  frontend   - Start only frontend development server"
        echo "  backend    - Start only backend development server"
        echo "  prod       - Build both frontend and backend for production"
        echo "  test       - Run API test suite"
        echo "  clear-data - Clear all database data"
        echo ""
        echo "Usage: ./launch.sh [mode]"
        exit 1
        ;;
esac