import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSubtle: string;
  surface: string;
  surfaceBorder: string;
  statusSuccess: string;
  statusWarning: string;
  shadowColor: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  card: '#F8FAFC',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  accent: '#166534',
  accentSubtle: '#F0FDF4',
  surface: '#F1F5F9',
  surfaceBorder: '#CBD5E1',
  statusSuccess: '#15803D',
  statusWarning: '#B45309',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
};

export const darkTheme: ThemeColors = {
  background: '#09090B',
  card: '#18181B',
  cardBorder: '#27272A',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  accent: '#22C55E',
  accentSubtle: '#052E16',
  surface: '#27272A',
  surfaceBorder: '#3F3F46',
  statusSuccess: '#4ADE80',
  statusWarning: '#FBBF24',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const activeIsDark = themeMode === 'system' 
    ? deviceScheme === 'dark' 
    : themeMode === 'dark';

  const colors = activeIsDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark: activeIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
