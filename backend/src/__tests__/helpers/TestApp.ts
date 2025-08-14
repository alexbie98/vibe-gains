import express from 'express';
import { createLiftsRouter } from '../../routes/lifts';
import Database from '../../database/database';

export function createTestApp(database: Database): express.Application {
  const app = express();
  
  // Middleware with error handling
  app.use((req, res, next) => {
    express.json({ limit: '10mb' })(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format'
        });
      }
      next();
    });
  });
  
  app.use(express.urlencoded({ extended: true }));
  
  // Routes
  app.use('/api/lifts', createLiftsRouter(database));
  
  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Test app error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
  
  return app;
}