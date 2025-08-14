import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import Database from '../database/database';
import { ApiResponse } from '../types';

const router = Router();

export const createUsersRouter = (database: Database) => {
  const userModel = new UserModel(database);

  // GET /api/users - Get all users
  router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const users = await userModel.findAll();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  });

  // GET /api/users/default - Get or create default user
  router.get('/default', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const defaultUser = await userModel.getOrCreateDefaultUser();
      res.json({
        success: true,
        data: defaultUser
      });
    } catch (error) {
      console.error('Error getting default user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get default user'
      });
    }
  });

  // GET /api/users/:id - Get specific user
  router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const user = await userModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      });
    }
  });

  // POST /api/users - Create new user
  router.post('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { name, email } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Name is required'
        });
      }

      const user = await userModel.create(name.trim(), email?.trim());

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }
  });

  return router;
};