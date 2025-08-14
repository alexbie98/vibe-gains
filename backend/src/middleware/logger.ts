import { Request, Response, NextFunction } from 'express';

interface LogData {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  body?: any;
  params?: any;
  query?: any;
}

export class RequestLogger {
  private static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private static getClientInfo(req: Request): { ip: string; userAgent: string } {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return { ip, userAgent };
  }

  private static generateNaturalSummary(req: Request, res: Response, duration: number): string {
    const { method, path, body, params, query } = req;
    const statusCode = res.statusCode;
    const { ip } = this.getClientInfo(req);

    let summary = '';
    const timestamp = new Date().toLocaleString();
    const durationStr = this.formatDuration(duration);

    // Generate natural language based on the endpoint and method
    switch (true) {
      // Lift operations
      case path === '/api/lifts' && method === 'GET':
        const filters = [];
        if (query.startDate) filters.push(`from ${query.startDate}`);
        if (query.endDate) filters.push(`to ${query.endDate}`);
        const filterStr = filters.length > 0 ? ` (${filters.join(' ')})` : '';
        summary = `📊 User retrieved their lift history${filterStr}`;
        break;

      case path === '/api/lifts' && method === 'POST':
        const exercise = body?.exercise || 'unknown exercise';
        const sets = body?.sets || [];
        const setCount = sets.length;
        const totalReps = sets.reduce((sum: number, set: any) => sum + (set.reps || 0), 0);
        const maxWeight = sets.length > 0 ? Math.max(...sets.map((s: any) => s.weight || 0)) : 0;
        summary = `💪 User added ${exercise}: ${setCount} sets, ${totalReps} total reps, max weight ${maxWeight}lbs`;
        break;

      case path.startsWith('/api/lifts/') && method === 'GET':
        const liftId = params?.id;
        summary = `🔍 User viewed details for lift ${liftId}`;
        break;

      case path.startsWith('/api/lifts/') && method === 'PUT':
        const updatedExercise = body?.exercise || 'exercise';
        const updatedSets = body?.sets || [];
        const updateDetails = [];
        if (body?.exercise) updateDetails.push(`exercise name`);
        if (body?.sets) updateDetails.push(`${updatedSets.length} sets`);
        if (body?.date) updateDetails.push(`date`);
        summary = `✏️ User updated ${updatedExercise}: modified ${updateDetails.join(', ')}`;
        break;

      case path.startsWith('/api/lifts/') && method === 'DELETE':
        const deletedLiftId = params?.id;
        summary = `🗑️ User deleted lift ${deletedLiftId}`;
        break;

      // User operations
      case path === '/api/users' && method === 'GET':
        summary = `👥 Retrieved all users list`;
        break;

      case path === '/api/users/default' && method === 'GET':
        summary = `👤 Retrieved or created default user`;
        break;

      case path === '/api/users' && method === 'POST':
        const userName = body?.name || 'unnamed user';
        summary = `✨ Created new user: ${userName}`;
        break;

      // Health check
      case path === '/health':
        summary = `🏥 Health check performed`;
        break;

      // Default
      default:
        summary = `🌐 ${method} request to ${path}`;
    }

    // Add status and performance info
    const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                       statusCode >= 400 && statusCode < 500 ? '⚠️' : '❌';
    
    const performanceInfo = duration > 1000 ? '🐌 SLOW' : duration > 500 ? '⏳' : '⚡';

    return `[${timestamp}] ${statusEmoji} ${summary} | ${statusCode} | ${durationStr} ${performanceInfo} | ${ip}`;
  }

  static detailedLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Log the incoming request
      const { method, path, body, params, query } = req;
      const { ip, userAgent } = this.getClientInfo(req);
      
      console.log(`\n🔵 INCOMING: ${method} ${path}`);
      if (Object.keys(params || {}).length > 0) {
        console.log(`   📋 Params:`, params);
      }
      if (Object.keys(query || {}).length > 0) {
        console.log(`   🔍 Query:`, query);
      }
      if (body && Object.keys(body).length > 0) {
        console.log(`   📦 Body:`, JSON.stringify(body, null, 2));
      }

      // Override res.json to capture response data
      const originalJson = res.json;
      let responseData: any;

      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Log when response is finished
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const summary = RequestLogger.generateNaturalSummary(req, res, duration);
        
        console.log(summary);
        
        if (responseData) {
          console.log(`   📤 Response:`, JSON.stringify(responseData, null, 2));
        }
        
        console.log(`   ⏱️  Duration: ${this.formatDuration(duration)}`);
        console.log(`   📱 User-Agent: ${userAgent}`);
        console.log('─'.repeat(80));
      });

      next();
    };
  }

  // Simple logger for basic requests
  static simpleLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const summary = RequestLogger.generateNaturalSummary(req, res, duration);
        console.log(summary);
      });

      next();
    };
  }
}