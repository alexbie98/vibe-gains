import { v4 as uuidv4 } from 'uuid';
import Database from '../database/database';
import { BodyWeight, CreateBodyWeightRequest, UpdateBodyWeightRequest } from '../types';

export class BodyWeightModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(userId: string, bodyWeightData: CreateBodyWeightRequest): Promise<BodyWeight> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const date = bodyWeightData.date || new Date().toDateString();
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO body_weights (id, user_id, weight, date, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      stmt.run([id, userId, bodyWeightData.weight, date, now, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            userId,
            weight: bodyWeightData.weight,
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

  async findById(id: string): Promise<BodyWeight | null> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, user_id as userId, weight, date, timestamp, 
             created_at as createdAt, updated_at as updatedAt
      FROM body_weights WHERE id = ?
    `);

    return new Promise((resolve, reject) => {
      stmt.get([id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          resolve(null);
        }
      });
      stmt.finalize();
    });
  }

  async findByUserId(userId: string): Promise<BodyWeight[]> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, user_id as userId, weight, date, timestamp,
             created_at as createdAt, updated_at as updatedAt
      FROM body_weights WHERE user_id = ? ORDER BY timestamp DESC
    `);

    return new Promise((resolve, reject) => {
      stmt.all([userId], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
      stmt.finalize();
    });
  }

  async update(id: string, updateData: UpdateBodyWeightRequest): Promise<BodyWeight | null> {
    const existingBodyWeight = await this.findById(id);
    if (!existingBodyWeight) {
      return null;
    }

    const now = new Date().toISOString();
    const weight = updateData.weight !== undefined ? updateData.weight : existingBodyWeight.weight;
    const date = updateData.date || existingBodyWeight.date;

    const stmt = this.db.getDb().prepare(`
      UPDATE body_weights 
      SET weight = ?, date = ?, updated_at = ?
      WHERE id = ?
    `);

    return new Promise((resolve, reject) => {
      stmt.run([weight, date, now, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            ...existingBodyWeight,
            weight,
            date,
            updatedAt: now
          });
        }
      });
      stmt.finalize();
    });
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.getDb().prepare(`DELETE FROM body_weights WHERE id = ?`);

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

  async findByUserIdAndDateRange(userId: string, startDate?: string, endDate?: string): Promise<BodyWeight[]> {
    let query = `
      SELECT id, user_id as userId, weight, date, timestamp,
             created_at as createdAt, updated_at as updatedAt
      FROM body_weights WHERE user_id = ?
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
          resolve(rows);
        }
      });
      stmt.finalize();
    });
  }
}