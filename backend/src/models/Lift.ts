import { v4 as uuidv4 } from 'uuid';
import Database from '../database/database';
import { Lift, Set, CreateLiftRequest, UpdateLiftRequest } from '../types';

export class LiftModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(userId: string, liftData: CreateLiftRequest): Promise<Lift> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const date = liftData.date || new Date().toDateString();
    const setsJson = JSON.stringify(liftData.sets);
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO lifts (id, user_id, exercise, sets, date, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      stmt.run([id, userId, liftData.exercise, setsJson, date, now, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            userId,
            exercise: liftData.exercise,
            sets: liftData.sets,
            date,
            timestamp: now,
            createdAt: now,
            updatedAt: now
          });
        }
      });
      stmt.finalize();
    });
  }

  async findById(id: string): Promise<Lift | null> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, user_id as userId, exercise, sets, date, timestamp, 
             created_at as createdAt, updated_at as updatedAt
      FROM lifts WHERE id = ?
    `);

    return new Promise((resolve, reject) => {
      stmt.get([id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            sets: JSON.parse(row.sets)
          });
        } else {
          resolve(null);
        }
      });
      stmt.finalize();
    });
  }

  async findByUserId(userId: string): Promise<Lift[]> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, user_id as userId, exercise, sets, date, timestamp,
             created_at as createdAt, updated_at as updatedAt
      FROM lifts WHERE user_id = ? ORDER BY timestamp DESC
    `);

    return new Promise((resolve, reject) => {
      stmt.all([userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const lifts = rows.map(row => ({
            ...row,
            sets: JSON.parse(row.sets)
          }));
          resolve(lifts);
        }
      });
      stmt.finalize();
    });
  }

  async update(id: string, updateData: UpdateLiftRequest): Promise<Lift | null> {
    const existingLift = await this.findById(id);
    if (!existingLift) {
      return null;
    }

    const now = new Date().toISOString();
    const exercise = updateData.exercise || existingLift.exercise;
    const sets = updateData.sets || existingLift.sets;
    const date = updateData.date || existingLift.date;
    const setsJson = JSON.stringify(sets);

    const stmt = this.db.getDb().prepare(`
      UPDATE lifts 
      SET exercise = ?, sets = ?, date = ?, updated_at = ?
      WHERE id = ?
    `);

    return new Promise((resolve, reject) => {
      stmt.run([exercise, setsJson, date, now, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            ...existingLift,
            exercise,
            sets,
            date,
            updatedAt: now
          });
        }
      });
      stmt.finalize();
    });
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.getDb().prepare(`DELETE FROM lifts WHERE id = ?`);

    return new Promise((resolve, reject) => {
      stmt.run([id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
      stmt.finalize();
    });
  }

  async findByUserIdAndDateRange(userId: string, startDate?: string, endDate?: string): Promise<Lift[]> {
    let query = `
      SELECT id, user_id as userId, exercise, sets, date, timestamp,
             created_at as createdAt, updated_at as updatedAt
      FROM lifts WHERE user_id = ?
    `;
    const params = [userId];

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY timestamp DESC`;

    const stmt = this.db.getDb().prepare(query);

    return new Promise((resolve, reject) => {
      stmt.all(params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const lifts = rows.map(row => ({
            ...row,
            sets: JSON.parse(row.sets)
          }));
          resolve(lifts);
        }
      });
      stmt.finalize();
    });
  }
}