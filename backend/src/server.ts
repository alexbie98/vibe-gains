import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';

import Database from './database/database';
import { createLiftsRouter } from './routes/lifts';
import { createUsersRouter } from './routes/users';
import { errorHandler, createRateLimit } from './middleware';
import { RequestLogger } from './middleware/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const database = new Database();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(RequestLogger.detailedLogger());
app.use(createRateLimit());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vibe Gains API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vibe Gains API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/lifts', createLiftsRouter(database));
app.use('/api/users', createUsersRouter(database));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await database.initialize();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Vibe Gains API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💪 API endpoints: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  try {
    await database.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();