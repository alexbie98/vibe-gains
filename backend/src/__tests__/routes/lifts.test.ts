import express from 'express';
import request from 'supertest';
import { TestDatabase } from '../helpers/TestDatabase';
import { createTestApp } from '../helpers/TestApp';
import { CreateLiftRequest, UpdateLiftRequest, ApiResponse, Lift } from '../../types';

describe('Lifts API Endpoints', () => {
  let app: express.Application;
  let testDb: TestDatabase;
  let testUserId: string;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    testUserId = await testDb.getTestUserId();

    // Create Express app with lifts routes
    app = createTestApp(testDb.getDatabase());
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    // Clean lifts table before each test
    await testDb.cleanLifts();
  });

  describe('GET /api/lifts', () => {
    it('should return empty array when no lifts exist', async () => {
      const response = await request(app)
        .get('/api/lifts')
        .expect(200);

      const body: ApiResponse<Lift[]> = response.body;
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('should return all lifts for default user', async () => {
      // Create test lifts directly in database
      const testLift1: CreateLiftRequest = {
        exercise: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
        date: 'Mon Jan 15 2024'
      };

      const testLift2: CreateLiftRequest = {
        exercise: 'Squat',
        sets: [{ weight: 225, reps: 5 }],
        date: 'Tue Jan 16 2024'
      };

      // First create via POST to ensure proper setup
      await request(app)
        .post('/api/lifts')
        .send(testLift1)
        .expect(201);

      await request(app)
        .post('/api/lifts')
        .send(testLift2)
        .expect(201);

      const response = await request(app)
        .get('/api/lifts')
        .expect(200);

      const body: ApiResponse<Lift[]> = response.body;
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data![0].exercise).toBe('Squat'); // Most recent first
      expect(body.data![1].exercise).toBe('Bench Press');
    });

    it('should filter lifts by date range', async () => {
      // Create lifts with different dates
      await request(app)
        .post('/api/lifts')
        .send({
          exercise: 'Exercise 1',
          sets: [{ weight: 100, reps: 10 }],
          date: 'Mon Jan 15 2024'
        });

      await request(app)
        .post('/api/lifts')
        .send({
          exercise: 'Exercise 2',
          sets: [{ weight: 200, reps: 5 }],
          date: 'Wed Jan 17 2024'
        });

      await request(app)
        .post('/api/lifts')
        .send({
          exercise: 'Exercise 3',
          sets: [{ weight: 150, reps: 8 }],
          date: 'Fri Jan 19 2024'
        });

      // Test start date filter - should return lifts from Jan 17 onwards
      const response1 = await request(app)
        .get('/api/lifts?startDate=Wed Jan 17 2024')
        .expect(200);

      expect(response1.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response1.body.data.every((lift: any) => lift.date >= 'Wed Jan 17 2024')).toBe(true);

      // Test end date filter - should return lifts up to Jan 17
      const response2 = await request(app)
        .get('/api/lifts?endDate=Wed Jan 17 2024')
        .expect(200);

      expect(response2.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response2.body.data.every((lift: any) => lift.date <= 'Wed Jan 17 2024')).toBe(true);

      // Test exact date filter
      const response3 = await request(app)
        .get('/api/lifts?startDate=Wed Jan 17 2024&endDate=Wed Jan 17 2024')
        .expect(200);

      expect(response3.body.data).toHaveLength(1);
      expect(response3.body.data![0].exercise).toBe('Exercise 2');
    });
  });

  describe('POST /api/lifts', () => {
    it('should create a new lift successfully', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Deadlift',
        sets: [
          { weight: 315, reps: 5 },
          { weight: 315, reps: 4 },
          { weight: 315, reps: 3 }
        ],
        date: 'Mon Jan 15 2024'
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(201);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        exercise: 'Deadlift',
        sets: liftData.sets,
        date: 'Mon Jan 15 2024'
      });
      expect(body.data!.id).toBeDefined();
      expect(body.data!.userId).toBeDefined();
      expect(body.data!.timestamp).toBeDefined();
    });

    it('should create lift with default date when not provided', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Pull-ups',
        sets: [{ weight: 180, reps: 10 }]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(201);

      const body: ApiResponse<Lift> = response.body;
      expect(body.data!.date).toBe(new Date().toDateString());
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing exercise
        sets: [{ weight: 100, reps: 10 }]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(invalidData)
        .expect(400);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
      expect(body.error).toBe('Exercise name is required');
    });

    it('should validate sets format', async () => {
      const invalidData = {
        exercise: 'Bench Press',
        sets: [
          { weight: 'invalid', reps: 10 }, // Invalid weight type
          { weight: 185, reps: -5 } // Invalid negative reps
        ]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(invalidData)
        .expect(400);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
    });

    it('should handle empty sets array', async () => {
      const invalidData = {
        exercise: 'Bench Press',
        sets: []
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(invalidData)
        .expect(400);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
      expect(body.error).toBe('At least one set is required');
    });
  });

  describe('PUT /api/lifts/:id', () => {
    let createdLift: Lift;

    beforeEach(async () => {
      // Create a lift to update
      const response = await request(app)
        .post('/api/lifts')
        .send({
          exercise: 'Bench Press',
          sets: [{ weight: 185, reps: 8 }],
          date: 'Mon Jan 15 2024'
        })
        .expect(201);

      createdLift = response.body.data;
    });

    it('should update lift exercise successfully', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Incline Bench Press'
      };

      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send(updateData)
        .expect(200);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      expect(body.data!.exercise).toBe('Incline Bench Press');
      expect(body.data!.sets).toEqual(createdLift.sets); // Should preserve original sets
      expect(body.data!.updatedAt).not.toBe(createdLift.updatedAt);
      expect(body.message).toBe('Lift updated successfully');
    });

    it('should update lift sets successfully', async () => {
      const newSets = [
        { weight: 195, reps: 8 },
        { weight: 195, reps: 6 },
        { weight: 185, reps: 8 }
      ];

      const updateData: UpdateLiftRequest = {
        sets: newSets
      };

      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send(updateData)
        .expect(200);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      expect(body.data!.sets).toEqual(newSets);
      expect(body.data!.exercise).toBe(createdLift.exercise); // Should preserve original exercise
    });

    it('should update lift date successfully', async () => {
      const updateData: UpdateLiftRequest = {
        date: 'Tue Jan 16 2024'
      };

      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send(updateData)
        .expect(200);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      expect(body.data!.date).toBe('Tue Jan 16 2024');
    });

    it('should update multiple fields at once', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Dumbbell Press',
        sets: [{ weight: 50, reps: 12 }],
        date: 'Wed Jan 17 2024'
      };

      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send(updateData)
        .expect(200);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        exercise: 'Dumbbell Press',
        sets: [{ weight: 50, reps: 12 }],
        date: 'Wed Jan 17 2024'
      });
    });

    it('should return 404 for non-existent lift', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Updated Exercise'
      };

      const response = await request(app)
        .put('/api/lifts/non-existent-id')
        .send(updateData)
        .expect(404);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
      expect(body.error).toBe('Lift not found');
    });

    it('should validate update data format', async () => {
      const invalidUpdateData = {
        sets: [
          { weight: 'invalid', reps: 10 } // Invalid weight type
        ]
      };

      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send(invalidUpdateData)
        .expect(400);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
    });

    it('should handle empty update data', async () => {
      const response = await request(app)
        .put(`/api/lifts/${createdLift.id}`)
        .send({})
        .expect(200);

      const body: ApiResponse<Lift> = response.body;
      expect(body.success).toBe(true);
      // Should preserve all original values
      expect(body.data!.exercise).toBe(createdLift.exercise);
      expect(body.data!.sets).toEqual(createdLift.sets);
      expect(body.data!.date).toBe(createdLift.date);
    });
  });

  describe('DELETE /api/lifts/:id', () => {
    let createdLift: Lift;

    beforeEach(async () => {
      // Create a lift to delete
      const response = await request(app)
        .post('/api/lifts')
        .send({
          exercise: 'Squat',
          sets: [{ weight: 225, reps: 5 }]
        })
        .expect(201);

      createdLift = response.body.data;
    });

    it('should delete lift successfully', async () => {
      const response = await request(app)
        .delete(`/api/lifts/${createdLift.id}`)
        .expect(200);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(true);
      expect(body.message).toBe('Lift deleted successfully');

      // Verify lift is actually deleted
      const getResponse = await request(app)
        .get('/api/lifts')
        .expect(200);

      expect(getResponse.body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent lift', async () => {
      const response = await request(app)
        .delete('/api/lifts/non-existent-id')
        .expect(404);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
      expect(body.error).toBe('Lift not found');
    });

    it('should handle malformed lift ID', async () => {
      const response = await request(app)
        .delete('/api/lifts/malformed-id')
        .expect(404);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/lifts')
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/lifts')
        .send('exercise=Bench&sets=[{weight:100,reps:10}]')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers in sets', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Heavy Lift',
        sets: [{ weight: 999999.99, reps: 1 }]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(201);

      expect(response.body.data.sets[0].weight).toBe(999999.99);
    });

    it('should reject zero weight values in sets', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Bodyweight Exercise',
        sets: [{ weight: 0, reps: 20 }]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(400);

      const body: ApiResponse = response.body;
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid weight in set');
    });

    it('should handle very long exercise names', async () => {
      const longExerciseName = 'A'.repeat(255); // Very long exercise name

      const liftData: CreateLiftRequest = {
        exercise: longExerciseName,
        sets: [{ weight: 100, reps: 10 }]
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(201);

      expect(response.body.data.exercise).toBe(longExerciseName);
    });

    it('should handle many sets in a single lift', async () => {
      const manySets = Array.from({ length: 20 }, (_, i) => ({
        weight: 100 + i,
        reps: 10 - Math.floor(i / 4)
      }));

      const liftData: CreateLiftRequest = {
        exercise: 'High Volume Exercise',
        sets: manySets
      };

      const response = await request(app)
        .post('/api/lifts')
        .send(liftData)
        .expect(201);

      expect(response.body.data.sets).toHaveLength(20);
      expect(response.body.data.sets).toEqual(manySets);
    });
  });
});