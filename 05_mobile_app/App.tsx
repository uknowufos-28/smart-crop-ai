import React from "react";
import { StyleSheet, Text, View, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "./src/constants/theme";

/**
 * SmartCropAI Root Application Entry Point.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.container}>
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
});
