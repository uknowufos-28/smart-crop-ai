import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Treatment'>;

export const TreatmentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { t, localizeClassName } = useLanguage();
  const insets = useSafeAreaInsets();
  const { diseaseName, cropName } = route.params;

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('safeNextSteps')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.bannerCard, { backgroundColor: colors.accentSubtle, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cropText, { color: colors.accent }]}>{localizeClassName(cropName)}</Text>
        <Text style={[styles.diseaseText, { color: colors.textPrimary }]}>{localizeClassName(diseaseName)}</Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color={colors.statusWarning} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('confirmTitle')}</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          {t('confirmBody')}
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkSymptomsTitle')}</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          {t('checkSymptomsBody')}
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color={colors.statusWarning} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('pesticideTitle')}</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          {t('pesticideBody')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Home')}
        accessibilityRole="button"
      >
        <Text style={styles.doneButtonText}>{t('returnHome')}</Text>
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
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cropText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  diseaseText: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
