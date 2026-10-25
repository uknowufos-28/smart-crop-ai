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
  modelVersion: string;
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
      CREATE TABLE IF NOT EXISTS AppSettings (
        settingKey TEXT PRIMARY KEY NOT NULL,
        settingValue TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ScanFeedback (
        diagnosisId TEXT PRIMARY KEY NOT NULL,
        response TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS DiagnosisLogs (
        id TEXT PRIMARY KEY NOT NULL,
        cropName TEXT NOT NULL,
        diseaseName TEXT NOT NULL,
        confidenceScore REAL NOT NULL,
        latencyMs REAL NOT NULL,
        imageUri TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        isSynced INTEGER NOT NULL DEFAULT 0,
        modelVersion TEXT NOT NULL DEFAULT 'legacy_unversioned'
      );
    `);
    const columns = await this.db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(DiagnosisLogs);`
    );
    if (!columns.some((column) => column.name === "modelVersion")) {
      await this.db.execAsync(
        `ALTER TABLE DiagnosisLogs ADD COLUMN modelVersion TEXT NOT NULL DEFAULT 'legacy_unversioned';`
      );
    }
  }

  async insertDiagnosis(
    record: Omit<LocalDiagnosisRecord, 'id' | 'timestamp' | 'isSynced'>
  ): Promise<LocalDiagnosisRecord> {
    const db = await this.getDb();
    const newRecord: LocalDiagnosisRecord = {
      id: `scan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isSynced: 0,
      ...record,
    };

    await db.runAsync(
      `INSERT INTO DiagnosisLogs (id, cropName, diseaseName, confidenceScore, latencyMs, imageUri, timestamp, isSynced, modelVersion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        newRecord.id,
        newRecord.cropName,
        newRecord.diseaseName,
        newRecord.confidenceScore,
        newRecord.latencyMs,
        newRecord.imageUri,
        newRecord.timestamp,
        newRecord.isSynced,
        newRecord.modelVersion,
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
    await db.runAsync(`DELETE FROM ScanFeedback WHERE diagnosisId = ?;`, [id]);
  }

  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ settingValue: string }>(
      `SELECT settingValue FROM AppSettings WHERE settingKey = ?;`,
      [key]
    );
    return row?.settingValue ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT INTO AppSettings (settingKey, settingValue) VALUES (?, ?)
       ON CONFLICT(settingKey) DO UPDATE SET settingValue = excluded.settingValue;`,
      [key, value]
    );
  }

  async saveScanFeedback(
    diagnosisId: string,
    response: "helpful" | "incorrect"
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT INTO ScanFeedback (diagnosisId, response, timestamp) VALUES (?, ?, ?)
       ON CONFLICT(diagnosisId) DO UPDATE SET
         response = excluded.response,
         timestamp = excluded.timestamp;`,
      [diagnosisId, response, new Date().toISOString()]
    );
  }

  async getScanFeedback(
    diagnosisId: string
  ): Promise<"helpful" | "incorrect" | null> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ response: string }>(
      `SELECT response FROM ScanFeedback WHERE diagnosisId = ?;`,
      [diagnosisId]
    );
    return row?.response === "helpful" || row?.response === "incorrect"
      ? row.response
      : null;
  }
}

export const databaseService = new DatabaseService();
