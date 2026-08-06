import * as SQLite from 'expo-sqlite';

export interface LocalDiagnosisRecord {
  id: string;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
  latencyMs: number;
  imageUri: string;
  timestamp: string;
  isSynced: number; // 0 = false, 1 = true
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('smartcropai.db');
      await this.initSchema();
    }
    return this.db;
  }

  private async initSchema(): Promise<void> {
    if (!this.db) return;
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS DiagnosisLogs (
        id TEXT PRIMARY KEY NOT NULL,
        cropName TEXT NOT NULL,
        diseaseName TEXT NOT NULL,
        confidenceScore REAL NOT NULL,
        latencyMs REAL NOT NULL,
        imageUri TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        isSynced INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async insertDiagnosis(record: Omit<LocalDiagnosisRecord, 'id' | 'timestamp' | 'isSynced'>): Promise<LocalDiagnosisRecord> {
    const db = await this.getDb();
    const newRecord: LocalDiagnosisRecord = {
      id: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isSynced: 0,
      ...record,
    };

    await db.runAsync(
      `INSERT INTO DiagnosisLogs (id, cropName, diseaseName, confidenceScore, latencyMs, imageUri, timestamp, isSynced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newRecord.id,
        newRecord.cropName,
        newRecord.diseaseName,
        newRecord.confidenceScore,
        newRecord.latencyMs,
        newRecord.imageUri,
        newRecord.timestamp,
        newRecord.isSynced,
      ]
    );

    return newRecord;
  }

  async getAllDiagnoses(): Promise<LocalDiagnosisRecord[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<LocalDiagnosisRecord>(
      `SELECT * FROM DiagnosisLogs ORDER BY timestamp DESC;`
    );
    return rows;
  }

  async getUnsyncedDiagnoses(): Promise<LocalDiagnosisRecord[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<LocalDiagnosisRecord>(
      `SELECT * FROM DiagnosisLogs WHERE isSynced = 0 ORDER BY timestamp ASC;`
    );
    return rows;
  }

  async markAsSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDb();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE DiagnosisLogs SET isSynced = 1 WHERE id IN (${placeholders});`,
      ids
    );
  }

  async deleteDiagnosis(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM DiagnosisLogs WHERE id = ?;`, [id]);
  }
}

export const databaseService = new DatabaseService();
