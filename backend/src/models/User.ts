import { v4 as uuidv4 } from 'uuid';
import Database from '../database/database';
import { User } from '../types';

export class UserModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async create(name: string, email?: string): Promise<User> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = this.db.getDb().prepare(`
      INSERT INTO users (id, name, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      stmt.run([id, name, email || null, now, now], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            name,
            email,
            createdAt: now,
            updatedAt: now
          });
        }
      });
      stmt.finalize();
    });
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, name, email, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `);

    return new Promise((resolve, reject) => {
      stmt.get([id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
      stmt.finalize();
    });
  }

  async findAll(): Promise<User[]> {
    const stmt = this.db.getDb().prepare(`
      SELECT id, name, email, created_at as createdAt, updated_at as updatedAt
      FROM users ORDER BY created_at ASC
    `);

    return new Promise((resolve, reject) => {
      stmt.all([], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
      stmt.finalize();
    });
  }

  async getOrCreateDefaultUser(): Promise<User> {
    const users = await this.findAll();
    
    if (users.length === 0) {
      return await this.create('Default User');
    }
    
    return users[0];
  }
}