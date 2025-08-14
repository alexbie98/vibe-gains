import Database from '../../database/database';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class TestDatabase {
  private database: Database | null = null;
  private testDbPath: string;

  constructor() {
    // Create unique test database file
    this.testDbPath = path.join(__dirname, `test_${uuidv4()}.db`);
  }

  async setup(): Promise<Database> {
    // Create a new database instance for testing
    this.database = new Database(this.testDbPath);
    await this.database.initialize();
    
    // Insert test user
    await this.seedTestData();
    
    return this.database;
  }

  async teardown(): Promise<void> {
    if (this.database) {
      this.database.close();
    }
    
    // Remove test database file
    if (fs.existsSync(this.testDbPath)) {
      fs.unlinkSync(this.testDbPath);
    }
  }

  getDatabase(): Database {
    if (!this.database) {
      throw new Error('Test database not initialized. Call setup() first.');
    }
    return this.database;
  }

  async cleanLifts(): Promise<void> {
    if (!this.database) return;
    
    const stmt = this.database.getDb().prepare('DELETE FROM lifts');
    return new Promise((resolve, reject) => {
      stmt.run([], (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }

  async getTestUserId(): Promise<string> {
    if (!this.database) {
      throw new Error('Test database not initialized');
    }

    const stmt = this.database.getDb().prepare('SELECT id FROM users LIMIT 1');
    return new Promise((resolve, reject) => {
      stmt.get([], (err, row: any) => {
        if (err) reject(err);
        else if (row) resolve(row.id);
        else reject(new Error('No test user found'));
      });
      stmt.finalize();
    });
  }

  private async seedTestData(): Promise<void> {
    if (!this.database) return;

    const testUserId = uuidv4();
    const now = new Date().toISOString();
    
    // Insert test user
    const userStmt = this.database.getDb().prepare(`
      INSERT INTO users (id, name, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    return new Promise((resolve, reject) => {
      userStmt.run([testUserId, 'Test User', 'test@example.com', now, now], (err) => {
        if (err) reject(err);
        else resolve();
      });
      userStmt.finalize();
    });
  }
}