import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = path.join(__dirname, '../../../data/lifts.db')) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create users table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);

        // Create lifts table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS lifts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            exercise TEXT NOT NULL,
            sets TEXT NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        // Create indexes for better performance
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_lifts_user_id ON lifts (user_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_lifts_date ON lifts (date)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_lifts_exercise ON lifts (exercise)`);
      });
    });
  }

  async get(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async run(sql: string, params?: any[]): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getDb(): sqlite3.Database {
    return this.db;
  }
}

export default Database;