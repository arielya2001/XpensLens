import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '@/i18n/translations';

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const MOCK_EMPLOYEES: User[] = [
  { id: 'emp1', name: 'Sarah Johnson', email: 'sarah@xpenslens.com', role: 'employee', department: 'Marketing' },
  { id: 'emp2', name: 'Michael Chen', email: 'michael@xpenslens.com', role: 'employee', department: 'Engineering' },
  { id: 'emp3', name: 'Emma Davis', email: 'emma@xpenslens.com', role: 'employee', department: 'Sales' },
  { id: 'emp4', name: 'James Wilson', email: 'james@xpenslens.com', role: 'employee', department: 'Operations' },
];

export const MOCK_ADMIN: User = {
  id: 'admin1', name: 'Alex Rivera', email: 'admin@xpenslens.com', role: 'admin', department: 'Finance',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = translations[language].dir;
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'he' : 'en');

  const t = (key: TranslationKey): string => {
    return translations[language][key] as string;
  };

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      language, toggleLanguage,
      t, dir: translations[language].dir,
      user, setUser,
      isAuthenticated: !!user,
      activeView, setActiveView,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
