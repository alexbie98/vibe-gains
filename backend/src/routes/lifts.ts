import { Router, Request, Response } from 'express';
import { LiftModel } from '../models/Lift';
import { UserModel } from '../models/User';
import Database from '../database/database';
import { ApiResponse, CreateLiftRequest, UpdateLiftRequest } from '../types';

const router = Router();

export const createLiftsRouter = (database: Database) => {
  const liftModel = new LiftModel(database);
  const userModel = new UserModel(database);

  /**
   * @swagger
   * /api/lifts:
   *   get:
   *     summary: Get all lifts for the default user
   *     tags: [Lifts]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *         description: "Filter lifts from this date (format: Mon Jan 15 2024)"
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *         description: "Filter lifts to this date (format: Mon Jan 15 2024)"
   *     responses:
   *       200:
   *         description: List of lifts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Lift'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  // GET /api/lifts - Get all lifts for default user
  router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const defaultUser = await userModel.getOrCreateDefaultUser();
      const { startDate, endDate } = req.query;
      
      const lifts = await liftModel.findByUserIdAndDateRange(
        defaultUser.id,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: lifts
      });
    } catch (error) {
      console.error('Error fetching lifts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lifts'
      });
    }
  });

  // GET /api/lifts/:id - Get specific lift
  router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const lift = await liftModel.findById(req.params.id);
      
      if (!lift) {
        return res.status(404).json({
          success: false,
          error: 'Lift not found'
        });
      }

      res.json({
        success: true,
        data: lift
      });
    } catch (error) {
      console.error('Error fetching lift:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lift'
      });
    }
  });

  /**
   * @swagger
   * /api/lifts:
   *   post:
   *     summary: Create a new lift
   *     tags: [Lifts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateLiftRequest'
   *           example:
   *             exercise: "Bench Press"
   *             sets:
   *               - weight: 185
   *                 reps: 8
   *               - weight: 185
   *                 reps: 6
   *               - weight: 175
   *                 reps: 10
   *             date: "Mon Jan 15 2024"
   *     responses:
   *       201:
   *         description: Lift created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Lift'
   *       400:
   *         description: Bad request - validation errors
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  // POST /api/lifts - Create new lift
  router.post('/', async (req: Request<{}, ApiResponse, CreateLiftRequest>, res: Response<ApiResponse>) => {
    try {
      const { exercise, sets, date } = req.body;
      console.log(`🏋️‍♂️ Creating new lift: ${exercise} with ${sets.length} sets`);

      // Validation
      if (!exercise || !exercise.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Exercise name is required'
        });
      }

      if (!sets || !Array.isArray(sets) || sets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one set is required'
        });
      }

      // Validate sets
      for (const set of sets) {
        if (typeof set.weight !== 'number' || set.weight <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid weight in set'
          });
        }
        if (typeof set.reps !== 'number' || set.reps <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid reps in set'
          });
        }
      }

      const defaultUser = await userModel.getOrCreateDefaultUser();
      const lift = await liftModel.create(defaultUser.id, { exercise, sets, date });

      console.log(`✅ Successfully created lift ID: ${lift.id}`);

      res.status(201).json({
        success: true,
        data: lift,
        message: 'Lift created successfully'
      });
    } catch (error) {
      console.error('Error creating lift:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create lift'
      });
    }
  });

  /**
   * @swagger
   * /api/lifts/{id}:
   *   put:
   *     summary: Update an existing lift
   *     tags: [Lifts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The lift ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateLiftRequest'
   *           example:
   *             exercise: "Bench Press"
   *             sets:
   *               - weight: 195
   *                 reps: 8
   *               - weight: 195
   *                 reps: 6
   *               - weight: 185
   *                 reps: 10
   *             date: "Mon Jan 16 2024"
   *     responses:
   *       200:
   *         description: Lift updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Lift'
   *       400:
   *         description: Bad request - validation errors
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       404:
   *         description: Lift not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  // PUT /api/lifts/:id - Update lift
  router.put('/:id', async (req: Request<{ id: string }, ApiResponse, UpdateLiftRequest>, res: Response<ApiResponse>) => {
    try {
      const { exercise, sets, date } = req.body;

      // Validation for sets if provided
      if (sets) {
        if (!Array.isArray(sets) || sets.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'At least one set is required'
          });
        }

        for (const set of sets) {
          if (typeof set.weight !== 'number' || set.weight <= 0) {
            return res.status(400).json({
              success: false,
              error: 'Invalid weight in set'
            });
          }
          if (typeof set.reps !== 'number' || set.reps <= 0) {
            return res.status(400).json({
              success: false,
              error: 'Invalid reps in set'
            });
          }
        }
      }

      const lift = await liftModel.update(req.params.id, { exercise, sets, date });

      if (!lift) {
        return res.status(404).json({
          success: false,
          error: 'Lift not found'
        });
      }

      res.json({
        success: true,
        data: lift,
        message: 'Lift updated successfully'
      });
    } catch (error) {
      console.error('Error updating lift:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update lift'
      });
    }
  });

  // DELETE /api/lifts/:id - Delete lift
  router.delete('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log(`🗑️ Attempting to delete lift ID: ${req.params.id}`);
      const deleted = await liftModel.delete(req.params.id);

      if (!deleted) {
        console.log(`❌ Lift ID ${req.params.id} not found for deletion`);
        return res.status(404).json({
          success: false,
          error: 'Lift not found'
        });
      }

      console.log(`✅ Successfully deleted lift ID: ${req.params.id}`);
      res.json({
        success: true,
        message: 'Lift deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting lift:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete lift'
      });
    }
  });

  return router;
};