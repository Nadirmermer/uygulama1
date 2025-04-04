import React, { createContext, useState, useContext, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
  initializeTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDarkMode: false,
  initializeTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // LocalStorage'dan tema tercihini al
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app_theme') as ThemeMode;
      return savedTheme || 'system';
    }
    return 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  const initializeTheme = () => {
    let finalIsDark = false;
    
    if (typeof window !== 'undefined') {
      // Kullanıcı tercihini al
      const savedTheme = localStorage.getItem('app_theme') as ThemeMode;
      
      // Kullanıcı tercihine göre tema belirle
      if (savedTheme === 'dark') {
        finalIsDark = true;
        setTheme('dark');
      } else if (savedTheme === 'light') {
        finalIsDark = false;
        setTheme('light');
      } else {
        // Sistem temasını kontrol et
        finalIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme('system');
      }
    }

    // Tema değişikliğini hemen uygula
    setIsDarkMode(finalIsDark);
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', finalIsDark);
    }
  };

  useEffect(() => {
    // Tema başlatma
    initializeTheme();
  }, []);

  useEffect(() => {
    // Tema değişikliğini localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', theme);
    }

    // Tema uygulaması
    const applyTheme = () => {
      let finalIsDark = false;

      if (theme === 'system' && typeof window !== 'undefined') {
        finalIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        finalIsDark = theme === 'dark';
      }

      setIsDarkMode(finalIsDark);
      
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', finalIsDark);
      }
    };

    // Tema değişimini hemen uygula
    applyTheme();

    // Sistem tema değişimini dinle
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          setIsDarkMode(e.matches);
          document.documentElement.classList.toggle('dark', e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const contextValue = {
    theme,
    setTheme: (newTheme: ThemeMode) => {
      setTheme(newTheme);
    },
    isDarkMode,
    initializeTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook oluştur
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 