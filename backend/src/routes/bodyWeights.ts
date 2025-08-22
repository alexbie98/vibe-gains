import { Router, Request, Response } from 'express';
import { BodyWeightModel } from '../models/BodyWeight';
import { UserModel } from '../models/User';
import Database from '../database/database';
import { ApiResponse, CreateBodyWeightRequest, UpdateBodyWeightRequest } from '../types';

const router = Router();

export const createBodyWeightsRouter = (database: Database) => {
  const bodyWeightModel = new BodyWeightModel(database);
  const userModel = new UserModel(database);

  /**
   * @swagger
   * /api/body-weights:
   *   get:
   *     summary: Get all body weights for the default user
   *     tags: [BodyWeights]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *         description: "Filter body weights from this date (format: Mon Jan 15 2024)"
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *         description: "Filter body weights to this date (format: Mon Jan 15 2024)"
   *     responses:
   *       200:
   *         description: List of body weights retrieved successfully
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
   *                         $ref: '#/components/schemas/BodyWeight'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   */
  // GET /api/body-weights - Get all body weights for default user
  router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const defaultUser = await userModel.getOrCreateDefaultUser();
      const { startDate, endDate } = req.query;
      
      const bodyWeights = await bodyWeightModel.findByUserIdAndDateRange(
        defaultUser.id,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: bodyWeights
      });
    } catch (error) {
      console.error('Error fetching body weights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch body weights'
      });
    }
  });

  // GET /api/body-weights/:id - Get specific body weight
  router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const bodyWeight = await bodyWeightModel.findById(req.params.id);
      
      if (!bodyWeight) {
        return res.status(404).json({
          success: false,
          error: 'Body weight not found'
        });
      }

      res.json({
        success: true,
        data: bodyWeight
      });
    } catch (error) {
      console.error('Error fetching body weight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch body weight'
      });
    }
  });

  /**
   * @swagger
   * /api/body-weights:
   *   post:
   *     summary: Create a new body weight entry
   *     tags: [BodyWeights]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateBodyWeightRequest'
   *           example:
   *             weight: 175.5
   *             date: "Mon Jan 15 2024"
   *     responses:
   *       201:
   *         description: Body weight created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BodyWeight'
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
  // POST /api/body-weights - Create new body weight
  router.post('/', async (req: Request<{}, ApiResponse, CreateBodyWeightRequest>, res: Response<ApiResponse>) => {
    try {
      const { weight, date } = req.body;
      console.log(`⚖️ Creating new body weight: ${weight} lbs`);

      // Validation
      if (typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid weight is required'
        });
      }

      const defaultUser = await userModel.getOrCreateDefaultUser();
      const bodyWeight = await bodyWeightModel.create(defaultUser.id, { weight, date });

      console.log(`✅ Successfully created body weight ID: ${bodyWeight.id}`);

      res.status(201).json({
        success: true,
        data: bodyWeight,
        message: 'Body weight created successfully'
      });
    } catch (error) {
      console.error('Error creating body weight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create body weight'
      });
    }
  });

  /**
   * @swagger
   * /api/body-weights/{id}:
   *   put:
   *     summary: Update an existing body weight
   *     tags: [BodyWeights]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The body weight ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateBodyWeightRequest'
   *           example:
   *             weight: 176.0
   *             date: "Mon Jan 16 2024"
   *     responses:
   *       200:
   *         description: Body weight updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BodyWeight'
   *       400:
   *         description: Bad request - validation errors
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       404:
   *         description: Body weight not found
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
  // PUT /api/body-weights/:id - Update body weight
  router.put('/:id', async (req: Request<{ id: string }, ApiResponse, UpdateBodyWeightRequest>, res: Response<ApiResponse>) => {
    try {
      const { weight, date } = req.body;

      // Validation for weight if provided
      if (weight !== undefined && (typeof weight !== 'number' || weight <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Valid weight is required'
        });
      }

      const bodyWeight = await bodyWeightModel.update(req.params.id, { weight, date });

      if (!bodyWeight) {
        return res.status(404).json({
          success: false,
          error: 'Body weight not found'
        });
      }

      res.json({
        success: true,
        data: bodyWeight,
        message: 'Body weight updated successfully'
      });
    } catch (error) {
      console.error('Error updating body weight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update body weight'
      });
    }
  });

  // DELETE /api/body-weights/:id - Delete body weight
  router.delete('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log(`🗑️ Attempting to delete body weight ID: ${req.params.id}`);
      const deleted = await bodyWeightModel.delete(req.params.id);

      if (!deleted) {
        console.log(`❌ Body weight ID ${req.params.id} not found for deletion`);
        return res.status(404).json({
          success: false,
          error: 'Body weight not found'
        });
      }

      console.log(`✅ Successfully deleted body weight ID: ${req.params.id}`);
      res.json({
        success: true,
        message: 'Body weight deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting body weight:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete body weight'
      });
    }
  });

  return router;
};