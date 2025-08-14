import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vibe Gains API',
    version: '1.0.0',
    description: 'A comprehensive API for tracking workout lifts and progress',
    contact: {
      name: 'Vibe Gains API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Set: {
        type: 'object',
        required: ['weight', 'reps'],
        properties: {
          weight: {
            type: 'number',
            description: 'Weight in pounds',
            example: 185.5,
          },
          reps: {
            type: 'integer',
            description: 'Number of repetitions',
            example: 8,
          },
        },
      },
      Lift: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the lift',
            example: 'abc-123-def',
          },
          userId: {
            type: 'string',
            description: 'ID of the user who performed the lift',
            example: 'user-456-ghi',
          },
          exercise: {
            type: 'string',
            description: 'Name of the exercise',
            example: 'Bench Press',
          },
          sets: {
            type: 'array',
            items: { $ref: '#/components/schemas/Set' },
            description: 'Array of sets performed',
          },
          date: {
            type: 'string',
            description: 'Date when the lift was performed',
            example: 'Mon Jan 15 2024',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp of when the lift was performed',
            example: '2024-01-15T10:30:00.000Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp of when the record was created',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp of when the record was last updated',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the user',
            example: 'user-456-ghi',
          },
          name: {
            type: 'string',
            description: 'User name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address (optional)',
            example: 'john@example.com',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp of when the user was created',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO timestamp of when the user was last updated',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
      CreateLiftRequest: {
        type: 'object',
        required: ['exercise', 'sets'],
        properties: {
          exercise: {
            type: 'string',
            description: 'Name of the exercise',
            example: 'Bench Press',
          },
          sets: {
            type: 'array',
            items: { $ref: '#/components/schemas/Set' },
            description: 'Array of sets to record',
            minItems: 1,
          },
          date: {
            type: 'string',
            description: 'Date when the lift was performed (optional, defaults to today)',
            example: 'Mon Jan 15 2024',
          },
        },
      },
      UpdateLiftRequest: {
        type: 'object',
        properties: {
          exercise: {
            type: 'string',
            description: 'Name of the exercise',
            example: 'Bench Press',
          },
          sets: {
            type: 'array',
            items: { $ref: '#/components/schemas/Set' },
            description: 'Array of sets to update',
          },
          date: {
            type: 'string',
            description: 'Date when the lift was performed',
            example: 'Mon Jan 15 2024',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          error: {
            type: 'string',
            description: 'Error message if success is false',
            example: 'Resource not found',
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Lift created successfully',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Vibe Gains API is running',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);