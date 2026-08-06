import { PredictionResult } from "./tfliteService";

export interface PendingSyncItem {
  id: string;
  cropName: string;
  diseaseName: string;
  confidenceScore: number;
  isOfflineDiagnosis: boolean;
  notes?: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  remainingQueueCount: number;
  message: string;
}

class OfflineTelemetrySyncManager {
  private queueKey: string = "@smartcropai_pending_diagnoses";
  private memoryQueue: PendingSyncItem[] = [];

  /**
   * Enqueues a new diagnostic AI scan into local offline storage queue.
   */
  public async enqueueDiagnosis(prediction: PredictionResult): Promise<PendingSyncItem> {
    const newItem: PendingSyncItem = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      cropName: prediction.cropName,
      diseaseName: prediction.diseaseName,
      confidenceScore: prediction.confidenceScore,
      isOfflineDiagnosis: true,
      notes: `Mobile AI scan (Latency: ${prediction.latencyMs}ms)`,
      timestamp: prediction.timestamp,
    };

    this.memoryQueue.push(newItem);
    console.log(`📥 [SyncService] Enqueued offline diagnosis log [${newItem.id}]. Queue length: ${this.memoryQueue.length}`);
    return newItem;
  }

  /**
   * Returns current pending offline queue items.
   */
  public getPendingQueue(): PendingSyncItem[] {
    return [...this.memoryQueue];
  }

  /**
   * Synchronizes queued offline diagnostic logs with Cloud REST API backend.
   * Calls POST /api/v1/diagnoses/sync endpoint.
   */
  public async syncPendingDiagnoses(
    authToken?: string,
    backendApiUrl: string = "http://localhost:5000/api/v1/diagnoses/sync"
  ): Promise<SyncResult> {
    if (this.memoryQueue.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        remainingQueueCount: 0,
        message: "No pending offline scan logs to synchronize.",
      };
    }

    const payload = {
      diagnoses: this.memoryQueue.map((item) => ({
        cropName: item.cropName,
        diseaseName: item.diseaseName,
        confidenceScore: item.confidenceScore,
        isOfflineDiagnosis: item.isOfflineDiagnosis,
        notes: item.notes,
      })),
    };

    try {
      console.log(`🚀 [SyncService] Synchronizing ${this.memoryQueue.length} items to ${backendApiUrl}...`);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(backendApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 201) {
        const syncedCount = this.memoryQueue.length;
        this.memoryQueue = []; // Clear queue on successful sync
        console.log(`✅ [SyncService] Batch sync successful! Synced ${syncedCount} records.`);

        return {
          success: true,
          syncedCount,
          remainingQueueCount: 0,
          message: `Successfully synchronized ${syncedCount} scan logs to Cloud DB.`,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned status HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.warn(`⚠️ [SyncService] Batch sync pending/offline fallback: ${error.message}`);
      return {
        success: false,
        syncedCount: 0,
        remainingQueueCount: this.memoryQueue.length,
        message: `Offline mode active: ${this.memoryQueue.length} logs cached locally for future sync.`,
      };
    }
  }
}

export const syncService = new OfflineTelemetrySyncManager();
