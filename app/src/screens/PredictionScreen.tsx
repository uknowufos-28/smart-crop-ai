import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, Zap, BookOpen, RefreshCw, AlertCircle } from 'lucide-react-native';
import { databaseService } from '../services/databaseService';
import { useLanguage } from '../i18n/LanguageContext';
import { MODEL_VERSION } from '../services/tfliteService';

type Props = NativeStackScreenProps<RootStackParamList, 'Prediction'>;

export const PredictionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { t, language, localizeClassName } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    imageUri,
    cropName,
    diseaseName,
    confidence,
    latencyMs,
    alternatives = [],
    scanId,
    savedAt,
    savedLocally = true,
    modelVersion = 'legacy_unversioned',
  } = route.params;
  const isLegacyModel = modelVersion !== MODEL_VERSION;
  const [feedback, setFeedback] = useState<'helpful' | 'incorrect' | null>(null);
  const [imageAvailable, setImageAvailable] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (scanId) {
      databaseService
        .getScanFeedback(scanId)
        .then((savedFeedback) => {
          if (mounted) setFeedback(savedFeedback);
        })
        .catch((error: unknown) => {
          console.error('Could not load saved local feedback:', error);
        });
    }
    return () => {
      mounted = false;
    };
  }, [scanId]);

  const submitFeedback = async (response: 'helpful' | 'incorrect') => {
    if (!scanId) return;
    try {
      await databaseService.saveScanFeedback(scanId, response);
      setFeedback(response);
      Alert.alert(t('feedbackQuestion'), t('feedbackSaved'));
    } catch (error) {
      console.error('Could not save local scan feedback:', error);
      Alert.alert(t('imageErrorTitle'), error instanceof Error ? error.message : t('imageErrorTitle'));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('Home')}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('screeningResult')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Captured Image Preview */}
      <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {imageAvailable ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageAvailable(false)}
            accessible
            accessibilityLabel={`${t('screeningResult')}: ${localizeClassName(cropName)}, ${localizeClassName(diseaseName)}`}
          />
        ) : (
          <Text style={[styles.imageMissing, { color: colors.textSecondary }]}>
            {t('savedResultMissing')}
          </Text>
        )}
      </View>

      {/* Primary Diagnosis Card */}
      <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.cropBadge, { backgroundColor: colors.accentSubtle }]}>
            <Text style={[styles.cropBadgeText, { color: colors.accent }]}>{localizeClassName(cropName)}</Text>
          </View>
          <View style={[styles.latencyBadge, { backgroundColor: colors.surface }]}>
            <Zap size={12} color={colors.textSecondary} />
            <Text style={[styles.latencyText, { color: colors.textSecondary }]}>{latencyMs}ms</Text>
          </View>
        </View>

        <Text style={[styles.diseaseTitle, { color: colors.textPrimary }]}>{localizeClassName(diseaseName)}</Text>

        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('modelScore')}</Text>
            <Text style={[styles.metricPercent, { color: colors.accent }]}>{(confidence * 100).toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {alternatives.length > 1 && (
        <View style={[styles.alternativesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.alternativesTitle, { color: colors.textPrimary }]}>{t('otherPossibilities')}</Text>
          {alternatives.slice(1).map((alternative) => (
            <View key={alternative.classIndex} style={styles.alternativeRow}>
              <Text style={[styles.alternativeLabel, { color: colors.textPrimary }]}>
                {localizeClassName(alternative.cropName)} · {localizeClassName(alternative.diseaseName)}
              </Text>
              <Text style={[styles.alternativeScore, { color: colors.textSecondary }]}>
                {(alternative.confidenceScore * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
          <Text style={[styles.alternativeNote, { color: colors.textSecondary }]}>{t('modelScore')}</Text>
        </View>
      )}

      <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.statusWarning }]}>
        <AlertCircle size={20} color={colors.statusWarning} />
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
          {t('experimentalWarning')}
        </Text>
      </View>
      {isLegacyModel && (
        <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.statusWarning }]}>
          <AlertCircle size={20} color={colors.statusWarning} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{t('legacyScanWarning')}</Text>
        </View>
      )}

      <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>{t('feedbackQuestion')}</Text>
        <Text style={[styles.feedbackNote, { color: colors.textSecondary }]}>{t('feedbackSyncNote')}</Text>
        {feedback ? (
          <Text style={[styles.feedbackSaved, { color: colors.statusSuccess }]}>{t('feedbackAlreadySaved')}</Text>
        ) : (
          <View style={styles.feedbackButtons}>
            <TouchableOpacity
              style={[styles.feedbackButton, { borderColor: colors.cardBorder }]}
              onPress={() => void submitFeedback('helpful')}
              disabled={!scanId}
              accessibilityRole="button"
              accessibilityLabel={t('feedbackHelpful')}
            >
              <Text style={[styles.feedbackButtonText, { color: colors.textPrimary }]}>{t('feedbackHelpful')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.feedbackButton, { borderColor: colors.cardBorder }]}
              onPress={() => void submitFeedback('incorrect')}
              disabled={!scanId}
              accessibilityRole="button"
              accessibilityLabel={t('feedbackIncorrect')}
            >
              <Text style={[styles.feedbackButtonText, { color: colors.textPrimary }]}>{t('feedbackIncorrect')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {savedAt && (
        <Text style={[styles.savedAt, { color: colors.textSecondary }]}>
          {t('scanDate')}: {new Date(savedAt).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
        </Text>
      )}
      {!savedLocally && (
        <Text style={[styles.savedAt, { color: colors.statusWarning }]}>{t('resultNotSaved')}</Text>
      )}

      {/* Action Buttons */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Treatment', { diseaseName, cropName })}
        accessibilityRole="button"
      >
        <BookOpen size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{t('safeNextSteps')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => navigation.navigate('Scanner')}
        accessibilityRole="button"
      >
        <RefreshCw size={20} color={colors.textPrimary} />
        <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>{t('scanAgain')}</Text>
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
    paddingTop: 20,
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
  imageMissing: {
    minHeight: 120,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: 20,
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
  alternativesCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  alternativeLabel: {
    flex: 1,
    fontSize: 15,
  },
  alternativeScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  alternativeNote: {
    fontSize: 12,
    marginTop: 8,
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
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackNote: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 12,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackSaved: {
    fontSize: 14,
    fontWeight: '600',
  },
  savedAt: {
    fontSize: 13,
    marginBottom: 12,
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
