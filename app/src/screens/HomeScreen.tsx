import React, { useState, useCallback, useEffect } from 'react';
import { Alert, Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { Camera, ShieldCheck, Cpu, History, Settings, CloudUpload, CheckCircle } from 'lucide-react-native';
import { syncService } from '../services/syncService';
import { useLanguage } from '../i18n/LanguageContext';
import { databaseService } from '../services/databaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, themeMode } = useTheme();
  const { t, isLanguageLoaded } = useLanguage();
  const insets = useSafeAreaInsets();
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [syncStatusText, setSyncStatusText] = useState<string>(t('syncChecking'));
  const [showFirstUseGuide, setShowFirstUseGuide] = useState(false);

  useEffect(() => {
    if (!isLanguageLoaded) return;
    let mounted = true;
    databaseService
      .getSetting('firstUseGuideSeen')
      .then((seen) => {
        if (mounted && seen !== '1') setShowFirstUseGuide(true);
      })
      .catch((error: unknown) => {
        console.error('Could not load first-use guide preference:', error);
        if (mounted) setShowFirstUseGuide(true);
      });
    return () => {
      mounted = false;
    };
  }, [isLanguageLoaded]);

  const refreshQueue = useCallback(async () => {
    try {
      const count = await syncService.getUnsyncedCount();
      setUnsyncedCount(count);
      setSyncStatusText(count > 0 ? t('signInNeeded') : t('noPending'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown local scan status error.';
      console.error('Failed to check local sync queue:', error);
      setSyncStatusText(`Could not check local scan queue: ${message}`);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void refreshQueue();
    }, [refreshQueue])
  );

  const checkAndTriggerSync = async () => {
    try {
      const count = await syncService.getUnsyncedCount();
      setUnsyncedCount(count);
      if (count === 0) {
        setSyncStatusText(t('noPending'));
        return;
      }
      const result = await syncService.syncPendingDiagnoses();
      setUnsyncedCount(result.remainingQueueCount);
      setSyncStatusText(result.remainingQueueCount === 0 ? t('noPending') : t('signInNeeded'));
    } catch (error) {
      console.error('Could not refresh local sync status:', error);
      await refreshQueue();
    }
  };

  const closeFirstUseGuide = async () => {
    try {
      await databaseService.setSetting('firstUseGuideSeen', '1');
      setShowFirstUseGuide(false);
    } catch (error) {
      console.error('Could not save first-use guide preference:', error);
      setShowFirstUseGuide(false);
      Alert.alert(t('imageErrorTitle'), error instanceof Error ? error.message : t('imageErrorTitle'));
    }
  };

  return (
    <>
      <Modal
        visible={showFirstUseGuide}
        transparent
        animationType="fade"
        onRequestClose={() => void closeFirstUseGuide()}
      >
        <View style={styles.guideBackdrop} accessibilityViewIsModal>
          <View style={[styles.guideCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>{t('firstUseTitle')}</Text>
            <Text style={[styles.guideBody, { color: colors.textSecondary }]}>{t('firstUseBody')}</Text>
            <TouchableOpacity
              style={[styles.guideButton, { backgroundColor: colors.accent }]}
              onPress={() => void closeFirstUseGuide()}
              accessibilityRole="button"
              accessibilityLabel={t('continue')}
            >
              <Text style={styles.guideButtonText}>{t('continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('agriculturalIntelligence')}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>SmartCropAI</Text>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
        >
          <Settings size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Cloud Telemetry Sync Banner */}
      <TouchableOpacity
        style={[styles.syncBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={checkAndTriggerSync}
        accessibilityRole="button"
        accessibilityLabel={`${t('syncTitle')}. ${syncStatusText}. ${t('syncCheck')}`}
      >
        <View style={styles.syncBannerLeft}>
          {unsyncedCount > 0 ? (
            <CloudUpload size={18} color={colors.statusWarning} />
          ) : (
            <CheckCircle size={18} color={colors.statusSuccess} />
          )}
          <View style={styles.syncTextContainer}>
            <Text style={[styles.syncBannerText, { color: colors.textPrimary }]}>{t('syncTitle')}</Text>
            {unsyncedCount > 0 && (
              <Text style={[styles.syncMeta, { color: colors.textSecondary }]}>
                {t('queuedScans', { count: unsyncedCount })}
              </Text>
            )}
            <Text style={[styles.syncMeta, { color: colors.textSecondary }]}>{syncStatusText}</Text>
            <Text style={[styles.syncAction, { color: colors.accent }]}>{t('syncCheck')}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Primary Scanner Action Card */}
      <TouchableOpacity
        style={[styles.primaryCard, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Scanner')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${t('scanLeaf')}. ${t('scanSubtitle')}`}
      >
        <View style={styles.primaryCardHeader}>
          <View style={styles.badge}>
            <Cpu size={14} color="#FFFFFF" />
            <Text style={styles.badgeText}>{t('experimentalBadge')}</Text>
          </View>
        </View>
        <Text style={styles.primaryCardTitle}>{t('scanLeaf')}</Text>
        <Text style={styles.primaryCardSubtitle}>
          {t('scanSubtitle')}
        </Text>
        <View style={styles.primaryCardFooter}>
          <Camera size={24} color="#FFFFFF" />
          <Text style={styles.primaryCardButtonText}>{t('openCamera')}</Text>
        </View>
      </TouchableOpacity>

      {/* Grid Quick Navigation */}
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
          accessibilityRole="button"
          accessibilityLabel={t('scanHistory')}
        >
          <History size={22} color={colors.accent} />
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>{t('scanHistory')}</Text>
          <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>{t('viewLocalRecords')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('HistorySettings')}
          accessibilityRole="button"
          accessibilityLabel={t('systemMode')}
        >
          <ShieldCheck size={22} color={colors.accent} />
          <Text style={[styles.gridTitle, { color: colors.textPrimary }]}>{t('systemMode')}</Text>
          <Text style={[styles.gridSubtitle, { color: colors.textSecondary }]}>{themeMode}</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Telemetry Status Card */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>{t('appStatus')}</Text>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('screening')}</Text>
          <Text style={[styles.metricValue, { color: colors.accent }]}>{t('onDevice')}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('history')}</Text>
          <Text style={[styles.metricValue, { color: colors.statusSuccess }]}>{t('localStorage')}</Text>
        </View>
      </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
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
    width: 48,
    height: 48,
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
  syncTextContainer: {
    flex: 1,
    gap: 4,
  },
  syncBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  syncAction: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
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
    flex: 1,
    fontSize: 13,
  },
  metricValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  guideBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'center',
    padding: 24,
  },
  guideCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },
  guideTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 12,
  },
  guideBody: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  guideButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  guideButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
