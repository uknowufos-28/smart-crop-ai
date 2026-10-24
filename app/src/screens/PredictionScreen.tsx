import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, ShieldCheck, Zap, BookOpen, RefreshCw, AlertCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Prediction'>;

export const PredictionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { imageUri, cropName, diseaseName, confidence, latencyMs } = route.params;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('Home')}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Experimental AI Screening</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Captured Image Preview */}
      <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>

      {/* Primary Diagnosis Card */}
      <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.cropBadge, { backgroundColor: colors.accentSubtle }]}>
            <Text style={[styles.cropBadgeText, { color: colors.accent }]}>{cropName}</Text>
          </View>
          <View style={[styles.latencyBadge, { backgroundColor: colors.surface }]}>
            <Zap size={12} color={colors.textSecondary} />
            <Text style={[styles.latencyText, { color: colors.textSecondary }]}>{latencyMs}ms</Text>
          </View>
        </View>

        <Text style={[styles.diseaseTitle, { color: colors.textPrimary }]}>{diseaseName}</Text>

        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Model score (not calibrated)</Text>
            <Text style={[styles.metricPercent, { color: colors.accent }]}>{(confidence * 100).toFixed(1)}%</Text>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.accent, width: `${Math.min(confidence * 100, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.statusWarning }]}>
        <AlertCircle size={20} color={colors.statusWarning} />
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
          This PlantDoc-trained model is experimental and has not been validated on local farm
          images. Its score is not a confirmed diagnosis. Check the plant with a local agricultural
          expert before taking action.
        </Text>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Treatment', { diseaseName, cropName })}
      >
        <BookOpen size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>View safe next steps</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => navigation.navigate('Scanner')}
      >
        <RefreshCw size={20} color={colors.textPrimary} />
        <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Scan Another Leaf</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
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
  imageCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 240,
  },
  resultCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cropBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  latencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  diseaseTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  metricContainer: {
    marginTop: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
