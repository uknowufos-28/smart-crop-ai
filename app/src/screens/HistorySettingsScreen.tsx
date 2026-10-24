import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { ArrowLeft, Sun, Moon, Smartphone, History, ShieldCheck, Trash2, Database } from 'lucide-react-native';
import { databaseService, LocalDiagnosisRecord } from '../services/databaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'HistorySettings'>;

export const HistorySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [records, setRecords] = useState<LocalDiagnosisRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await databaseService.getAllDiagnoses();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await databaseService.deleteDiagnosis(id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light Theme', icon: <Sun size={18} color={themeMode === 'light' ? colors.accent : colors.textSecondary} /> },
    { mode: 'dark', label: 'Dark Theme', icon: <Moon size={18} color={themeMode === 'dark' ? colors.accent : colors.textSecondary} /> },
    { mode: 'system', label: 'System Theme', icon: <Smartphone size={18} color={themeMode === 'system' ? colors.accent : colors.textSecondary} /> },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings & History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Theme Switcher Section */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Appearance & Theme</Text>
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

      {/* Offline History Records Section */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
        Local Scan History ({records.length})
      </Text>

      {records.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Database size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No offline scans recorded yet</Text>
        </View>
      ) : (
        records.map((item) => (
          <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.historyLeft}>
              <Text style={[styles.historyCrop, { color: colors.accent }]}>{item.cropName}</Text>
              <Text style={[styles.historyDisease, { color: colors.textPrimary }]}>{item.diseaseName}</Text>
              <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                {(item.confidenceScore * 100).toFixed(1)}% model score • {item.latencyMs.toFixed(1)}ms
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
              <Trash2 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Application Meta Info */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>About Application</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>SmartCropAI Mobile</Text>
        <Text style={[styles.aboutSub, { color: colors.textSecondary }]}>Version 1.0.0 • Experimental PlantDoc model with offline inference</Text>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
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
    paddingVertical: 14,
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
    padding: 8,
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
