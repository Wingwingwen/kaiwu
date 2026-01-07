import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type SageTheme = 'default' | 'confucius' | 'laozi' | 'buddha' | 'plato';

interface SageThemeContextType {
  currentTheme: SageTheme;       // 当前显示的主题（可能是预览或锁定的）
  lockedTheme: SageTheme;        // 用户锁定的默认主题
  isTransitioning: boolean;
  isPreviewing: boolean;         // 是否正在预览（悬停状态）
  previewTheme: (theme: SageTheme) => void;   // 悬停预览
  endPreview: () => void;        // 结束预览，恢复到锁定主题
  lockTheme: (theme: SageTheme) => void;      // 点击锁定主题
}

const SageThemeContext = createContext<SageThemeContextType | undefined>(undefined);

const themeClassMap: Record<SageTheme, string> = {
  default: '',
  confucius: 'theme-confucius',
  laozi: 'theme-laozi',
  buddha: 'theme-buddha',
  plato: 'theme-plato',
};

const STORAGE_KEY = 'enlightenment-journal-theme';

export function SageThemeProvider({ children }: { children: ReactNode }) {
  // 从localStorage读取用户锁定的主题
  const [lockedTheme, setLockedTheme] = useState<SageTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['default', 'confucius', 'laozi', 'buddha', 'plato'].includes(saved)) {
        return saved as SageTheme;
      }
    }
    return 'default';
  });
  
  const [currentTheme, setCurrentTheme] = useState<SageTheme>(lockedTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // 初始化时应用锁定的主题
  useEffect(() => {
    setCurrentTheme(lockedTheme);
  }, []);

  // Apply theme class to document with smooth transition
  useEffect(() => {
    const root = document.documentElement;
    
    // Add transitioning class for smooth CSS transitions
    root.classList.add('theme-transitioning');
    
    // Remove all theme classes
    Object.values(themeClassMap).forEach(cls => {
      if (cls) root.classList.remove(cls);
    });
    
    // Add current theme class
    const themeClass = themeClassMap[currentTheme];
    if (themeClass) {
      root.classList.add(themeClass);
    }
    
    // Remove transitioning class after animation completes
    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [currentTheme]);

  // 悬停预览主题
  const previewTheme = useCallback((theme: SageTheme) => {
    if (theme === currentTheme) return;
    
    setIsPreviewing(true);
    setIsTransitioning(true);
    setCurrentTheme(theme);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);
  }, [currentTheme]);

  // 结束预览，恢复到锁定的主题
  const endPreview = useCallback(() => {
    if (!isPreviewing) return;
    
    setIsPreviewing(false);
    
    if (currentTheme !== lockedTheme) {
      setIsTransitioning(true);
      setCurrentTheme(lockedTheme);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1200);
    }
  }, [isPreviewing, currentTheme, lockedTheme]);

  // 点击锁定主题
  const lockTheme = useCallback((theme: SageTheme) => {
    setLockedTheme(theme);
    setCurrentTheme(theme);
    setIsPreviewing(false);
    
    // 持久化到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }, []);

  return (
    <SageThemeContext.Provider value={{
      currentTheme,
      lockedTheme,
      isTransitioning,
      isPreviewing,
      previewTheme,
      endPreview,
      lockTheme,
    }}>
      {/* Simple container without flip animation */}
      <div className="min-h-screen transition-colors duration-1000 ease-out">
        {children}
      </div>
    </SageThemeContext.Provider>
  );
}

export function useSageTheme() {
  const context = useContext(SageThemeContext);
  if (!context) {
    throw new Error('useSageTheme must be used within a SageThemeProvider');
  }
  return context;
}
