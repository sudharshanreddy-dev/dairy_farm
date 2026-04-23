import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  green: string;
  greenDim: string;
  amber: string;
  amberDim: string;
  red: string;
  redDim: string;
  blue: string;
  blueDim: string;
  violet: string;
  violetDim: string;
  accent: string;
  cardShadow: string;
  glass: string;
}

const darkColors: ThemeColors = {
  bg: '#010409', // Darker black
  surface: '#0d1117',
  surface2: '#161b22',
  border: '#30363d',
  text: '#f0f6fc',
  muted: '#8b949e',
  green: '#3fb950',
  greenDim: 'rgba(63, 185, 80, 0.15)',
  amber: '#d29922',
  amberDim: 'rgba(210, 153, 34, 0.15)',
  red: '#f85149',
  redDim: 'rgba(248, 81, 73, 0.15)',
  blue: '#58a6ff',
  blueDim: 'rgba(88, 166, 255, 0.15)',
  violet: '#bc8cff',
  violetDim: 'rgba(188, 140, 255, 0.15)',
  accent: '#238636',
  cardShadow: 'rgba(0,0,0,0.5)',
  glass: 'rgba(255,255,255,0.03)',
};

const lightColors: ThemeColors = {
  bg: '#f6f8fa',
  surface: '#ffffff',
  surface2: '#f0f3f7',
  border: '#d0d7de',
  text: '#1f2328',
  muted: '#656d76',
  green: '#1a7f37',
  greenDim: 'rgba(26, 127, 55, 0.1)',
  amber: '#9a6700',
  amberDim: 'rgba(154, 103, 0, 0.1)',
  red: '#cf222e',
  redDim: 'rgba(207, 34, 46, 0.1)',
  blue: '#0969da',
  blueDim: 'rgba(9, 105, 218, 0.1)',
  violet: '#8250df',
  violetDim: 'rgba(130, 80, 223, 0.1)',
  accent: '#1a7f37',
  cardShadow: 'rgba(31, 35, 40, 0.08)',
  glass: 'rgba(0,0,0,0.02)',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  colors: darkColors,
  isDark: true,
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('themeMode').then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemeModeState(saved as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
