# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start
- `./scripts/launch.sh` or `./scripts/launch.sh dev` - Starts both frontend and backend development servers
- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:3001
- Backend health check: http://localhost:3001/health

### Individual Services
- `./scripts/launch.sh frontend` - Start only frontend development server
- `./scripts/launch.sh backend` - Start only backend development server

### Frontend (React + TypeScript) - Located in `frontend/`
- `cd frontend && npm start` - Start development server (port 3000)
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm test` - Run tests with Jest

### Backend (Node.js + Express + TypeScript) - Located in `backend/`
- `cd backend && ../scripts/backend-launch.sh dev` - Start development server with nodemon (port 3001)
- `cd backend && npm run build` - Compile TypeScript to dist/
- `cd backend && npm start` - Run compiled production build
- `cd backend && npm test` - Run Jest tests

### Production & Testing
- `./scripts/launch.sh prod` - Build both frontend and backend for production
- `./scripts/launch.sh test` - Run comprehensive API test suite
- `./scripts/launch.sh clear-data` - Clear all database data

### API Testing
- `cd backend && ../scripts/backend-launch.sh test` - Comprehensive API test suite with sample data
- API documentation available at http://localhost:3001/api-docs (Swagger UI)

## Directory Structure

```
vibe-gains/
├── frontend/           # React + TypeScript frontend source code
├── backend/            # Node.js + Express + TypeScript backend source code
│   ├── src/           # Backend application code
│   └── dist/          # Compiled TypeScript output
├── data/              # SQLite database files (excluded from git)
│   └── lifts.db       # Main application database
├── scripts/           # Deployment and utility scripts
│   ├── launch.sh      # Main launch script for development/production
│   ├── backend-launch.sh  # Backend-specific launch script
│   └── clear-data.sh  # Database cleanup script
├── CLAUDE.md          # This file - project documentation
└── .gitignore         # Git ignore rules (excludes data/ and database files)
```

## Architecture Overview

This is a full-stack lift tracking application with a React frontend and Node.js backend, with clear separation between source code, deployment files, and data.

### Frontend Architecture - `frontend/`
- **React + TypeScript** with functional components and hooks
- **Context API** for state management (`src/context/LiftContext.tsx`) - manages lifts, loading, error states, and search filtering
- **Styled Components** for styling (`src/styles/GlobalStyles.ts`)
- **Component Structure** in `src/components/`:
  - `Dashboard` - Main view with lift statistics and charts
  - `AddLiftModal` - Form for creating new lifts with date selection
  - `LiftCard` - Individual lift display with delete functionality
  - `LiftHistory` - Lift list with search/filter capabilities
  - `ProgressChart` - Max weight progress chart that syncs with search filter
  - `TodayLifts` - Today's workout summary
- **API Service** (`src/services/api.ts`) - HTTP client for backend communication
- **Types** (`src/types.ts`) - Shared TypeScript interfaces

### Backend Architecture - `backend/`
- **Express.js + TypeScript** REST API
- **SQLite Database** with custom database abstraction layer
- **Model Layer** - `src/models/Lift.ts` and `src/models/User.ts` handle database operations
- **Router Layer** - Express routers in `src/routes/` for API endpoints
- **Middleware** - Custom error handling, logging, rate limiting, security (helmet, cors) in `src/middleware/`
- **Swagger Documentation** - Auto-generated API docs from JSDoc comments in `src/docs/`
- **Database** - SQLite file stored in `backend/data/lifts.db`

### Data Models
- **Lift**: exercise, sets (weight/reps), date, timestamps, user association
- **User**: Default user system (single-user application)
- **Set**: weight (number) and reps (number)

### Key Patterns
- **Promise-based database operations** with callback-to-promise conversion
- **UUID primary keys** for all entities
- **JSON serialization** for complex fields (sets array stored as JSON in SQLite)
- **Error boundary pattern** with try-catch and error state management
- **RESTful API design** with proper HTTP status codes and JSON responses

### Database
- SQLite database stored in `data/lifts.db`
- Tables: `lifts`, `users`
- Database initialization handled automatically on server startup
- Custom Database class wraps sqlite3 with connection management

### Testing
- Backend has shell scripts for API testing with curl and jq
- Uses JSON payloads to test CRUD operations
- Tests include error scenarios and validation