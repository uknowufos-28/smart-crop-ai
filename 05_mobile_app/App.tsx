import React, { useState } from "react";
import { StyleSheet, Text, View, StatusBar, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, Zap, ShieldCheck, CloudUpload, RefreshCw } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "./src/constants/theme";
import { CameraScanner } from "./src/components/CameraScanner";
import { tfliteService, PredictionResult } from "./src/services/tfliteService";
import { syncService } from "./src/services/syncService";

/**
 * SmartCropAI Root Application Entry Point.
 */
export default function App() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(syncService.getPendingQueue().length);

  const handleImageCaptured = async (uri: string) => {
    setSelectedImageUri(uri);
    setIsAnalyzing(true);
    setPrediction(null);

    try {
      const result = await tfliteService.classifyLeafImage(uri);
      setPrediction(result);
      await syncService.enqueueDiagnosis(result);
      setPendingCount(syncService.getPendingQueue().length);
    } catch (err) {
      console.error("Diagnostic inference error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSyncTelemetry = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.syncPendingDiagnoses();
      setPendingCount(syncService.getPendingQueue().length);
      Alert.alert(res.success ? "Cloud Telemetry Synced" : "Sync Status", res.message);
    } catch (error: any) {
      Alert.alert("Sync Error", error.message || "Failed connecting to backend API.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCard}>
            <Text style={TYPOGRAPHY.titleHero}>🌱 SmartCropAI</Text>
            <Text style={TYPOGRAPHY.caption}>On-Device AI Disease Diagnostics</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.indicatorGreen} />
              <Text style={TYPOGRAPHY.titleCard}>Offline Engine Ready</Text>
            </View>
            <Text style={TYPOGRAPHY.bodyMedium}>
              MobileNetV2 INT8 quantized model loaded (2.93 MB). Fast on-host inference (&lt;150ms) without cellular connection.
            </Text>

            {/* Cloud Sync Telemetry Banner */}
            <TouchableOpacity
              style={styles.syncBannerButton}
              onPress={handleSyncTelemetry}
              disabled={isSyncing}
            >
              <CloudUpload size={18} color={COLORS.primaryLight} />
              <Text style={styles.syncBannerText}>
                {isSyncing
                  ? "Syncing Telemetry to Cloud..."
                  : `Sync ${pendingCount} Pending Scans to Cloud`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Live Camera Leaf Scanner Component */}
          <View style={styles.scannerWrapper}>
            <CameraScanner onImageCaptured={handleImageCaptured} isLoading={isAnalyzing} />
          </View>

          {/* Inference Loading Indicator */}
          {isAnalyzing && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[TYPOGRAPHY.bodyLarge, styles.loadingText]}>
                Running On-Device INT8 Neural Network Inference...
              </Text>
            </View>
          )}

          {/* Diagnostic AI Result Card */}
          {prediction && !isAnalyzing && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.cropBadge}>
                  <Text style={styles.cropBadgeText}>{prediction.cropName.toUpperCase()}</Text>
                </View>
                <View style={styles.latencyBadge}>
                  <Zap size={14} color={COLORS.accent} />
                  <Text style={styles.latencyText}>{prediction.latencyMs} ms</Text>
                </View>
              </View>

              <Text style={TYPOGRAPHY.titleHeader}>{prediction.diseaseName}</Text>

              <View style={styles.confidenceRow}>
                <Text style={TYPOGRAPHY.bodyMedium}>Detection Confidence:</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{prediction.confidencePercentage}</Text>
                </View>
              </View>

              <View style={styles.remedyBox}>
                <View style={styles.remedyHeader}>
                  <ShieldCheck size={18} color={COLORS.primaryLight} />
                  <Text style={styles.remedyTitle}>Recommended Treatment</Text>
                </View>
                <Text style={TYPOGRAPHY.bodyMedium}>
                  Apply organic copper-based fungicide spray at first sign of spotting. Remove infected lower leaves and ensure drip irrigation to avoid wet foliage.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerCard: {
    marginBottom: SPACING.xxl,
    alignItems: "center",
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  indicatorGreen: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  scrollContent: {
    paddingBottom: SPACING.huge,
  },
  scannerWrapper: {
    marginTop: SPACING.xl,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cropBadge: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  cropBadgeText: {
    color: COLORS.primaryLight,
    fontWeight: "700",
    fontSize: 12,
  },
  latencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  latencyText: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: SPACING.md,
  },
  confidenceBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  confidenceText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  remedyBox: {
    backgroundColor: COLORS.surfaceElevated,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  remedyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  remedyTitle: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
  syncBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  syncBannerText: {
    color: COLORS.primaryLight,
    fontWeight: "600",
    fontSize: 13,
    marginLeft: SPACING.xs,
  },
});
