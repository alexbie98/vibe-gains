#!/bin/bash

# Clear Vibe Gains Database Script
# Usage: ./clear-data.sh
# This script will delete all lifts and users from the database

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

DATABASE_PATH="$PROJECT_ROOT/data/lifts.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  Vibe Gains Data Cleanup${NC}"
echo "================================="

# Check if database file exists
if [ ! -f "$DATABASE_PATH" ]; then
    echo -e "${YELLOW}⚠️  Database file not found at $DATABASE_PATH${NC}"
    echo "Either the database hasn't been created yet, or it's in a different location."
    exit 0
fi

echo -e "${YELLOW}📋 Current database status:${NC}"
echo "Database file: $DATABASE_PATH"
echo "File size: $(ls -lh $DATABASE_PATH | awk '{print $5}')"

# Count current records
LIFT_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM lifts;" 2>/dev/null || echo "0")
USER_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

echo "Current lifts: $LIFT_COUNT"
echo "Current users: $USER_COUNT"

if [ "$LIFT_COUNT" = "0" ] && [ "$USER_COUNT" = "0" ]; then
    echo -e "${GREEN}✅ Database is already empty!${NC}"
    exit 0
fi

echo ""
echo -e "${RED}⚠️  WARNING: This will permanently delete ALL data!${NC}"
echo "This action cannot be undone."
echo ""
read -p "Are you sure you want to clear all data? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}❌ Operation cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}🧹 Clearing database...${NC}"

# Clear the tables
sqlite3 "$DATABASE_PATH" << EOF
DELETE FROM lifts;
DELETE FROM users;
VACUUM;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database cleared successfully!${NC}"
    
    # Show updated counts
    NEW_LIFT_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM lifts;" 2>/dev/null || echo "0")
    NEW_USER_COUNT=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    
    echo "Remaining lifts: $NEW_LIFT_COUNT"
    echo "Remaining users: $NEW_USER_COUNT"
    echo "New file size: $(ls -lh $DATABASE_PATH | awk '{print $5}')"
    
    echo ""
    echo -e "${BLUE}🔄 Next steps:${NC}"
    echo "1. Restart your backend server if it's running"
    echo "2. Refresh your frontend application"
    echo "3. The app will create a new default user when you add your first lift"
else
    echo -e "${RED}❌ Failed to clear database!${NC}"
    exit 1
fi