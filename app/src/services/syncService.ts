import { databaseService, LocalDiagnosisRecord } from "./databaseService";

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  remainingQueueCount: number;
  message: string;
}

class OfflineTelemetrySyncManager {
  private getBackendApiUrl(): string {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
    if (!baseUrl) {
      throw new Error(
        "Cloud sync is not configured. Set EXPO_PUBLIC_API_BASE_URL to the backend URL."
      );
    }
    return `${baseUrl}/api/v1/diagnoses/sync`;
  }

  /**
   * Queries unsynced SQLite records and attempts batch synchronization with the cloud backend REST API.
   */
  public async syncPendingDiagnoses(authToken?: string): Promise<SyncResult> {
    let remainingQueueCount: number | undefined;
    try {
      const unsyncedItems: LocalDiagnosisRecord[] = await databaseService.getUnsyncedDiagnoses();
      remainingQueueCount = unsyncedItems.length;

      if (unsyncedItems.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          remainingQueueCount: 0,
          message: "All local diagnostic logs are synchronized.",
        };
      }

      if (!authToken) {
        return {
          success: false,
          syncedCount: 0,
          remainingQueueCount: unsyncedItems.length,
          message: `Cloud sync requires sign-in; ${unsyncedItems.length} records remain saved locally.`,
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

      const response = await fetch(this.getBackendApiUrl(), {
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
    } catch (error: unknown) {
      if (remainingQueueCount === undefined) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown cloud sync error.";
      console.warn(`[SyncService] Cloud sync failed: ${errorMessage}`);
      return {
        success: false,
        syncedCount: 0,
        remainingQueueCount,
        message: `Cloud sync failed: ${errorMessage} Records remain saved locally.`,
      };
    }
  }

  /**
   * Returns current count of unsynced SQLite records.
   */
  public async getUnsyncedCount(): Promise<number> {
    const items = await databaseService.getUnsyncedDiagnoses();
    return items.length;
  }
}

export const syncService = new OfflineTelemetrySyncManager();
