import React, { createContext, useContext, useState, useEffect } from 'react';

export const PreferencesContext = createContext({
  theme: 'dark',
  language: 'es',
  toggleTheme: () => {},
  setLanguage: () => {},
  setTheme: () => {},
  isDark: true,
});

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vetia-theme') || 'dark';
    }
    return 'dark';
  });

  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vetia-lang') || 'es';
    }
    return 'es';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vetia-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('vetia-lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    theme,
    language,
    toggleTheme,
    setLanguage,
    setTheme,
    isDark: theme === 'dark',
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export default PreferencesContext;
