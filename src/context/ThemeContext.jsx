import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { applyThemeToDOM } from './themeUtils';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const themes = {
  light: {
    name: 'Light',
    primary: {
      50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
      400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
      800: '#075985', 900: '#0c4a6e',
    },
    accent: {
      50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
      400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
      800: '#854d0e', 900: '#713f12',
    },
    bg: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
  },
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentThemeId, setCurrentThemeId] = useState('light');
  const [customTheme, setCustomTheme] = useState(null);

  useEffect(() => {
    if (user?.user?.theme) {
      const saved = user.user.theme;
      if (typeof saved === 'string' && themes[saved]) {
        setCurrentThemeId(saved);
        applyThemeToDOM(themes[saved]);
      } else if (saved?.type === 'custom' && saved.colors) {
        setCurrentThemeId('custom');
        setCustomTheme(saved.colors);
        applyThemeToDOM(saved.colors);
      } else {
        applyThemeToDOM(themes.light);
      }
    } else {
      applyThemeToDOM(themes.light);
    }
  }, [user]);

  const value = {
    themeId: currentThemeId,
    isCustom: currentThemeId === 'custom',
    theme: currentThemeId === 'custom' ? customTheme : themes[currentThemeId],
    allThemes: themes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};