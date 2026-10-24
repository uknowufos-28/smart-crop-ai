import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { Camera, ShieldCheck, Cpu, History, Settings, CloudUpload, CheckCircle } from 'lucide-react-native';
import { syncService } from '../services/syncService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, themeMode } = useTheme();
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [syncStatusText, setSyncStatusText] = useState<string>('Checking sync status...');

  useEffect(() => {
    checkAndTriggerSync();
  }, []);

  const checkAndTriggerSync = async () => {
    try {
      const count = await syncService.getUnsyncedCount();
      setUnsyncedCount(count);

      if (count > 0) {
        const result = await syncService.syncPendingDiagnoses();
        setSyncStatusText(result.message);
        setUnsyncedCount(result.remainingQueueCount);
      } else {
        setSyncStatusText('No pending scans on this device');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown local scan status error.';
      console.error('Failed to check local sync queue:', error);
      setSyncStatusText(`Could not check local scan queue: ${message}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Agricultural Intelligence</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>SmartCropAI</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
        >
          <Settings size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Cloud Telemetry Sync Banner */}
      <TouchableOpacity
        style={[styles.syncBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={checkAndTriggerSync}
      >
        <View style={styles.syncBannerLeft}>
          {unsyncedCount > 0 ? (
            <CloudUpload size={18} color={colors.statusWarning} />
          ) : (
            <CheckCircle size={18} color={colors.statusSuccess} />
          )}
          <Text style={[styles.syncBannerText, { color: colors.textPrimary }]}>{syncStatusText}</Text>
        </View>
      </TouchableOpacity>

      {/* Primary Scanner Action Card */}
      <TouchableOpacity
        style={[styles.primaryCard, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Scanner')}
        activeOpacity={0.85}
      >
        <View style={styles.primaryCardHeader}>
          <View style={styles.badge}>
            <Cpu size={14} color="#FFFFFF" />
            <Text style={styles.badgeText}>PlantDoc classifier • Experimental</Text>
          </View>
        </View>
        <Text style={styles.primaryCardTitle}>Scan Crop Leaf</Text>
        <Text style={styles.primaryCardSubtitle}>
          Experimental offline leaf-image screening. Confirm results with a local agriculture expert.
        </Text>
        <View style={styles.primaryCardFooter}>
          <Camera size={24} color="#FFFFFF" />
          <Text style={styles.primaryCardButtonText}>Launch Camera Scanner</Text>
        </View>
      </TouchableOpacity>

      {/* Grid Quick Navigation */}
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
        >
          <History size={22} color={colors.accent} />
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>Scan History</Text>
          <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>View local scan records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
        >
          <ShieldCheck size={22} color={colors.accent} />
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>System Mode</Text>
          <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>Theme: {themeMode}</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Telemetry Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>App status</Text>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Leaf screening</Text>
          <Text style={[styles.metricValue, { color: colors.accent }]}>On-device, no network required</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Scan history</Text>
          <Text style={[styles.metricValue, { color: colors.statusSuccess }]}>SQLite Active</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  syncBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  primaryCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  primaryCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryCardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  primaryCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  primaryCardButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 12,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 13,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});
