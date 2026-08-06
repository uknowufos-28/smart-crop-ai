import { databaseService, LocalDiagnosisRecord } from "./databaseService";

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  remainingQueueCount: number;
  message: string;
}

class OfflineTelemetrySyncManager {
  private backendApiUrl: string = "http://localhost:5000/api/v1/diagnoses/sync";

  /**
   * Queries unsynced SQLite records and attempts batch synchronization with the cloud backend REST API.
   */
  public async syncPendingDiagnoses(authToken?: string): Promise<SyncResult> {
    try {
      const unsyncedItems: LocalDiagnosisRecord[] = await databaseService.getUnsyncedDiagnoses();

      if (unsyncedItems.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          remainingQueueCount: 0,
          message: "All local diagnostic logs are synchronized.",
        };
      }

      console.log(`🚀 [SyncService] Attempting background batch sync for ${unsyncedItems.length} SQLite records...`);

      const payload = {
        diagnoses: unsyncedItems.map((item) => ({
          cropName: item.cropName,
          diseaseName: item.diseaseName,
          confidenceScore: item.confidenceScore,
          isOfflineDiagnosis: true,
          notes: `Mobile scan (Latency: ${item.latencyMs.toFixed(1)}ms)`,
        })),
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(this.backendApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 201) {
        const syncedIds = unsyncedItems.map((item) => item.id);
        await databaseService.markAsSynced(syncedIds);

        console.log(`✅ [SyncService] Successfully synchronized ${syncedIds.length} records to Cloud DB.`);

        return {
          success: true,
          syncedCount: syncedIds.length,
          remainingQueueCount: 0,
          message: `Successfully synchronized ${syncedIds.length} records to Cloud DB.`,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned status HTTP ${response.status}`);
      }
    } catch (error: any) {
      const unsyncedItems = await databaseService.getUnsyncedDiagnoses().catch(() => []);
      console.warn(`⚠️ [SyncService] Background sync fallback (Offline Mode): ${error.message}`);
      return {
        success: false,
        syncedCount: 0,
        remainingQueueCount: unsyncedItems.length,
        message: `Offline mode active: ${unsyncedItems.length} records saved locally in SQLite.`,
      };
    }
  }

  /**
   * Returns current count of unsynced SQLite records.
   */
  public async getUnsyncedCount(): Promise<number> {
    try {
      const items = await databaseService.getUnsyncedDiagnoses();
      return items.length;
    } catch (err) {
      return 0;
    }
  }
}

export const syncService = new OfflineTelemetrySyncManager();
