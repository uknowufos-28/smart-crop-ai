import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { ShieldCheck } from 'lucide-react-native';
import { useLanguage } from '../i18n/LanguageContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, isLanguageLoaded } = useLanguage();

  useEffect(() => {
    if (!isLanguageLoaded) return undefined;
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLanguageLoaded, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.accentSubtle, borderColor: colors.cardBorder }]}>
        <ShieldCheck size={48} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>SmartCropAI</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('splashSubtitle')}
      </Text>
      <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 32,
    textAlign: 'center',
  },
  loader: {
    marginTop: 16,
  },
});
