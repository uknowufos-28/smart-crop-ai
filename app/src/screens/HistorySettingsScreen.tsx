import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { ArrowLeft, Sun, Moon, Smartphone, ShieldCheck, Trash2, Database } from 'lucide-react-native';
import { databaseService, LocalDiagnosisRecord } from '../services/databaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { AppLanguage } from '../i18n/translations';
import { syncService } from '../services/syncService';

type Props = NativeStackScreenProps<RootStackParamList, 'HistorySettings'>;

export const HistorySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage, localizeClassName } = useLanguage();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<LocalDiagnosisRecord[]>([]);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [isCheckingSync, setIsCheckingSync] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const [data, pending] = await Promise.all([
        databaseService.getAllDiagnoses(),
        syncService.getUnsyncedCount(),
      ]);
      setRecords(data);
      setUnsyncedCount(pending);
      setSyncMessage(pending === 0 ? t('noPending') : t('signInNeeded'));
    } catch (error) {
      console.error('Failed to load local scan history:', error);
      Alert.alert(t('imageErrorTitle'), error instanceof Error ? error.message : t('imageErrorTitle'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  const handleDelete = async (id: string) => {
    try {
      const record = records.find((entry) => entry.id === id);
      await databaseService.deleteDiagnosis(id);
      if (record?.imageUri.startsWith('file://')) {
        await FileSystem.deleteAsync(record.imageUri, { idempotent: true });
      }
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete local history item:', error);
      Alert.alert(t('imageErrorTitle'), error instanceof Error ? error.message : t('imageErrorTitle'));
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('deleteScan'), t('deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => void handleDelete(id) },
    ]);
  };

  const checkSync = async () => {
    setIsCheckingSync(true);
    try {
      const result = await syncService.syncPendingDiagnoses();
      setUnsyncedCount(result.remainingQueueCount);
      setSyncMessage(
        result.remainingQueueCount === 0 ? t('noPending') : t('signInNeeded')
      );
    } catch (error) {
      console.error('Cloud sync check failed:', error);
      setSyncMessage(error instanceof Error ? error.message : t('signInNeeded'));
    } finally {
      setIsCheckingSync(false);
    }
  };

  const chooseLanguage = async (nextLanguage: AppLanguage) => {
    try {
      await setLanguage(nextLanguage);
    } catch (error) {
      console.error('Could not save language preference:', error);
      Alert.alert(t('imageErrorTitle'), error instanceof Error ? error.message : t('imageErrorTitle'));
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: t('lightTheme'), icon: <Sun size={18} color={themeMode === 'light' ? colors.accent : colors.textSecondary} /> },
    { mode: 'dark', label: t('darkTheme'), icon: <Moon size={18} color={themeMode === 'dark' ? colors.accent : colors.textSecondary} /> },
    { mode: 'system', label: t('systemTheme'), icon: <Smartphone size={18} color={themeMode === 'system' ? colors.accent : colors.textSecondary} /> },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Theme Switcher Section */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{t('appearance')}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {themeOptions.map((option) => {
          const isSelected = themeMode === option.mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionRow,
                isSelected && { backgroundColor: colors.surface },
              ]}
              onPress={() => setThemeMode(option.mode)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.optionLeft}>
                {option.icon}
                <Text style={[styles.optionLabel, { color: isSelected ? colors.accent : colors.textPrimary }]}>
                  {option.label}
                </Text>
              </View>
              {isSelected && <ShieldCheck size={18} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{t('language')}</Text>
      <View style={[styles.card, styles.languageRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {(['en', 'ta'] as const).map((option) => {
          const selected = language === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.languageOption,
                { borderColor: selected ? colors.accent : colors.cardBorder },
                selected && { backgroundColor: colors.accentSubtle },
              ]}
              onPress={() => void chooseLanguage(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option === 'en' ? t('english') : t('tamil')}
            >
              <Text style={[styles.optionLabel, { color: selected ? colors.accent : colors.textPrimary }]}>
                {option === 'en' ? t('english') : t('tamil')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{t('syncTitle')}</Text>
      <View style={[styles.card, styles.syncCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.syncMessage, { color: colors.textPrimary }]}>
          {unsyncedCount > 0 ? t('queuedScans', { count: unsyncedCount }) : t('noPending')}
        </Text>
        <Text style={[styles.syncMessage, { color: colors.textSecondary }]}>{syncMessage || t('signInNeeded')}</Text>
        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: colors.accent }]}
          onPress={() => void checkSync()}
          disabled={isCheckingSync || unsyncedCount === 0}
          accessibilityRole="button"
          accessibilityLabel={t('syncCheck')}
        >
          <Text style={styles.syncButtonText}>{isCheckingSync ? t('syncChecking') : t('syncCheck')}</Text>
        </TouchableOpacity>
      </View>

      {/* Offline History Records Section */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{t('localHistory')} ({records.length})</Text>

      {records.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Database size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noHistory')}</Text>
        </View>
      ) : (
        records.map((item) => (
          <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.historyLeft}
              onPress={() => navigation.navigate('Prediction', {
                imageUri: item.imageUri,
                cropName: item.cropName,
                diseaseName: item.diseaseName,
                confidence: item.confidenceScore,
                latencyMs: item.latencyMs,
                scanId: item.id,
                savedAt: item.timestamp,
                savedLocally: true,
                modelVersion: item.modelVersion,
              })}
              accessibilityRole="button"
              accessibilityLabel={`${t('viewResult')}: ${localizeClassName(item.cropName)}, ${localizeClassName(item.diseaseName)}`}
            >
              <Text style={[styles.historyCrop, { color: colors.accent }]}>{localizeClassName(item.cropName)}</Text>
              <Text style={[styles.historyDisease, { color: colors.textPrimary }]}>{localizeClassName(item.diseaseName)}</Text>
              <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                {t('modelScore')}: {(item.confidenceScore * 100).toFixed(1)}%
              </Text>
              <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                {t('scanDate')}: {new Date(item.timestamp).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t('deleteScan')}: ${localizeClassName(item.cropName)}`}
            >
              <Trash2 size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Application Meta Info */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{t('appAbout')}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>SmartCropAI Mobile</Text>
        <Text style={[styles.aboutSub, { color: colors.textSecondary }]}>{t('appDescription')}</Text>
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
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
    padding: 6,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  languageOption: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCard: {
    padding: 16,
  },
  syncMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  syncButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: {
    flex: 1,
  },
  historyCrop: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  historyDisease: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
  },
  deleteButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  aboutSub: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: 2,
  },
});
