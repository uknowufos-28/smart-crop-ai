import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Treatment'>;

export const TreatmentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { diseaseName, cropName } = route.params;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Safe Next Steps</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.bannerCard, { backgroundColor: colors.accentSubtle, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cropText, { color: colors.accent }]}>{cropName}</Text>
        <Text style={[styles.diseaseText, { color: colors.textPrimary }]}>{diseaseName}</Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color={colors.statusWarning} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Do not treat from this result alone</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          This is an experimental image-model prediction, not a confirmed diagnosis or treatment
          recommendation. The model has not been validated on local farm images.
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Confirm the symptoms</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          Photograph several affected and healthy leaves, note which plants and parts are affected,
          and ask a local agricultural extension officer or qualified plant-health professional to
          verify the cause.
        </Text>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color={colors.statusWarning} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pesticide safety</Text>
        </View>
        <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
          Do not apply pesticides based only on this prediction. Follow local expert guidance and
          the product label, including crop approval, protective equipment, and waiting periods.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.doneButtonText}>Return to Home</Text>
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
