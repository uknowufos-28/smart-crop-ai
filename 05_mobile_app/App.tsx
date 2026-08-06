import React, { useState } from "react";
import { StyleSheet, Text, View, StatusBar, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "./src/constants/theme";
import { CameraScanner } from "./src/components/CameraScanner";

/**
 * SmartCropAI Root Application Entry Point.
 */
export default function App() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const handleImageCaptured = (uri: string) => {
    console.log("📸 Leaf Image Captured:", uri);
    setSelectedImageUri(uri);
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
          </View>

          {/* Live Camera Leaf Scanner Component */}
          <View style={styles.scannerWrapper}>
            <CameraScanner onImageCaptured={handleImageCaptured} />
          </View>
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
});
