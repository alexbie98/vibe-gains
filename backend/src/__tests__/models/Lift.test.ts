import { LiftModel } from '../../models/Lift';
import { TestDatabase } from '../helpers/TestDatabase';
import { CreateLiftRequest, UpdateLiftRequest, Lift } from '../../types';

describe('LiftModel', () => {
  let testDb: TestDatabase;
  let liftModel: LiftModel;
  let testUserId: string;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
    liftModel = new LiftModel(testDb.getDatabase());
    testUserId = await testDb.getTestUserId();
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    // Clean lifts table before each test
    await testDb.cleanLifts();
  });

  describe('create', () => {
    it('should create a new lift successfully', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Bench Press',
        sets: [
          { weight: 185, reps: 8 },
          { weight: 185, reps: 6 },
          { weight: 185, reps: 5 }
        ],
        date: 'Mon Jan 15 2024'
      };

      const result = await liftModel.create(testUserId, liftData);

      expect(result).toMatchObject({
        userId: testUserId,
        exercise: 'Bench Press',
        sets: liftData.sets,
        date: 'Mon Jan 15 2024'
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a lift with default date when not provided', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Squat',
        sets: [{ weight: 225, reps: 5 }]
      };

      const result = await liftModel.create(testUserId, liftData);

      expect(result.date).toBe(new Date().toDateString());
    });

    it('should handle sets with decimal weights', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Dumbbell Curl',
        sets: [
          { weight: 22.5, reps: 10 },
          { weight: 25.0, reps: 8 }
        ]
      };

      const result = await liftModel.create(testUserId, liftData);

      expect(result.sets).toEqual([
        { weight: 22.5, reps: 10 },
        { weight: 25.0, reps: 8 }
      ]);
    });
  });

  describe('findById', () => {
    it('should find an existing lift by ID', async () => {
      const liftData: CreateLiftRequest = {
        exercise: 'Deadlift',
        sets: [{ weight: 315, reps: 3 }]
      };

      const createdLift = await liftModel.create(testUserId, liftData);
      const foundLift = await liftModel.findById(createdLift.id);

      expect(foundLift).toMatchObject({
        id: createdLift.id,
        userId: testUserId,
        exercise: 'Deadlift',
        sets: [{ weight: 315, reps: 3 }]
      });
    });

    it('should return null for non-existent ID', async () => {
      const result = await liftModel.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should correctly parse JSON sets field', async () => {
      const complexSets = [
        { weight: 135, reps: 10 },
        { weight: 155, reps: 8 },
        { weight: 175, reps: 6 },
        { weight: 185, reps: 4 }
      ];

      const liftData: CreateLiftRequest = {
        exercise: 'Overhead Press',
        sets: complexSets
      };

      const createdLift = await liftModel.create(testUserId, liftData);
      const foundLift = await liftModel.findById(createdLift.id);

      expect(foundLift?.sets).toEqual(complexSets);
    });
  });

  describe('findByUserId', () => {
    it('should return all lifts for a user in descending timestamp order', async () => {
      // Create multiple lifts with small delays to ensure different timestamps
      const lift1 = await liftModel.create(testUserId, {
        exercise: 'Exercise 1',
        sets: [{ weight: 100, reps: 10 }]
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const lift2 = await liftModel.create(testUserId, {
        exercise: 'Exercise 2',
        sets: [{ weight: 200, reps: 5 }]
      });

      const lifts = await liftModel.findByUserId(testUserId);

      expect(lifts).toHaveLength(2);
      // Should be in descending order (most recent first)
      expect(lifts[0].id).toBe(lift2.id);
      expect(lifts[1].id).toBe(lift1.id);
    });

    it('should return empty array for user with no lifts', async () => {
      const lifts = await liftModel.findByUserId('non-existent-user');
      expect(lifts).toEqual([]);
    });
  });

  describe('update', () => {
    let existingLift: Lift;

    beforeEach(async () => {
      existingLift = await liftModel.create(testUserId, {
        exercise: 'Bench Press',
        sets: [{ weight: 185, reps: 8 }],
        date: 'Mon Jan 15 2024'
      });
    });

    it('should update exercise name', async () => {
      // Add a small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updateData: UpdateLiftRequest = {
        exercise: 'Incline Bench Press'
      };

      const result = await liftModel.update(existingLift.id, updateData);

      expect(result).toMatchObject({
        id: existingLift.id,
        exercise: 'Incline Bench Press',
        sets: existingLift.sets,
        date: existingLift.date
      });
      expect(result?.updatedAt).not.toBe(existingLift.updatedAt);
    });

    it('should update sets', async () => {
      const newSets = [
        { weight: 195, reps: 8 },
        { weight: 195, reps: 6 },
        { weight: 185, reps: 8 }
      ];

      const updateData: UpdateLiftRequest = {
        sets: newSets
      };

      const result = await liftModel.update(existingLift.id, updateData);

      expect(result?.sets).toEqual(newSets);
    });

    it('should update date', async () => {
      const updateData: UpdateLiftRequest = {
        date: 'Tue Jan 16 2024'
      };

      const result = await liftModel.update(existingLift.id, updateData);

      expect(result?.date).toBe('Tue Jan 16 2024');
    });

    it('should update multiple fields at once', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Dumbbell Press',
        sets: [{ weight: 50, reps: 12 }],
        date: 'Wed Jan 17 2024'
      };

      const result = await liftModel.update(existingLift.id, updateData);

      expect(result).toMatchObject({
        id: existingLift.id,
        exercise: 'Dumbbell Press',
        sets: [{ weight: 50, reps: 12 }],
        date: 'Wed Jan 17 2024'
      });
    });

    it('should return null for non-existent lift', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Updated Exercise'
      };

      const result = await liftModel.update('non-existent-id', updateData);
      expect(result).toBeNull();
    });

    it('should preserve unchanged fields when partial update', async () => {
      const updateData: UpdateLiftRequest = {
        exercise: 'Updated Exercise'
        // Not updating sets or date
      };

      const result = await liftModel.update(existingLift.id, updateData);

      expect(result).toMatchObject({
        exercise: 'Updated Exercise',
        sets: existingLift.sets,
        date: existingLift.date
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing lift', async () => {
      const lift = await liftModel.create(testUserId, {
        exercise: 'Squat',
        sets: [{ weight: 225, reps: 5 }]
      });

      const deleteResult = await liftModel.delete(lift.id);
      expect(deleteResult).toBe(true);

      const foundLift = await liftModel.findById(lift.id);
      expect(foundLift).toBeNull();
    });

    it('should return false for non-existent lift', async () => {
      const result = await liftModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('findByUserIdAndDateRange', () => {
    beforeEach(async () => {
      // Create lifts with different dates
      await liftModel.create(testUserId, {
        exercise: 'Exercise 1',
        sets: [{ weight: 100, reps: 10 }],
        date: 'Mon Jan 15 2024'
      });

      await liftModel.create(testUserId, {
        exercise: 'Exercise 2',
        sets: [{ weight: 200, reps: 5 }],
        date: 'Wed Jan 17 2024'
      });

      await liftModel.create(testUserId, {
        exercise: 'Exercise 3',
        sets: [{ weight: 150, reps: 8 }],
        date: 'Fri Jan 19 2024'
      });
    });

    it('should return all lifts when no date range specified', async () => {
      const lifts = await liftModel.findByUserIdAndDateRange(testUserId);
      expect(lifts).toHaveLength(3);
    });

    it('should filter by start date', async () => {
      const lifts = await liftModel.findByUserIdAndDateRange(testUserId, 'Wed Jan 17 2024');
      expect(lifts.length).toBeGreaterThanOrEqual(1);
      expect(lifts.every(lift => lift.date >= 'Wed Jan 17 2024')).toBe(true);
    });

    it('should filter by end date', async () => {
      const lifts = await liftModel.findByUserIdAndDateRange(testUserId, undefined, 'Wed Jan 17 2024');
      expect(lifts.length).toBeGreaterThanOrEqual(1);
      expect(lifts.every(lift => lift.date <= 'Wed Jan 17 2024')).toBe(true);
    });

    it('should filter by date range', async () => {
      const lifts = await liftModel.findByUserIdAndDateRange(
        testUserId, 
        'Wed Jan 17 2024', 
        'Wed Jan 17 2024'
      );
      expect(lifts).toHaveLength(1);
      expect(lifts[0].date).toBe('Wed Jan 17 2024');
    });

    it('should return empty array for date range with no matches', async () => {
      const lifts = await liftModel.findByUserIdAndDateRange(
        testUserId, 
        'Sat Jan 20 2024', 
        'Sun Jan 21 2024'
      );
      expect(lifts).toHaveLength(0);
    });
  });
});