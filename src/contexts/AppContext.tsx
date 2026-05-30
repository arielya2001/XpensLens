import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '@/i18n/translations';
import { apiRequest } from '@/lib/api-client';

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  department?: string | null;
}

interface AuthResponse {
  token: string;
  user: BackendUser;
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
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: 'EMPLOYEE' | 'ADMIN'; department?: string }) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function toFrontendUser(b: BackendUser): User {
  return {
    id: b.id,
    name: b.name,
    email: b.email,
    role: b.role === 'ADMIN' ? 'admin' : 'employee',
    department: b.department ?? undefined,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  );
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('language') as Language) ?? 'en'
  );
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = translations[language].dir;
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    apiRequest<BackendUser>('/auth/me')
      .then(u => setUser(toFrontendUser(u)))
      .catch(() => localStorage.removeItem('token'));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', res.token);
    setUser(toFrontendUser(res.user));
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'EMPLOYEE' | 'ADMIN';
    department?: string;
  }) => {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('token', res.token);
    setUser(toFrontendUser(res.user));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveView('dashboard');
  };

  const toggleTheme = () => setTheme(prev => {
    const next = prev === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    return next;
  });
  const toggleLanguage = () => setLanguage(prev => {
    const next = prev === 'en' ? 'he' : 'en';
    localStorage.setItem('language', next);
    return next;
  });
  const t = (key: TranslationKey): string => translations[language][key] as string;

  return (
    <AppContext.Provider
      value={{
        theme, toggleTheme,
        language, toggleLanguage,
        t, dir: translations[language].dir,
        user, setUser,
        isAuthenticated: !!user,
        activeView, setActiveView,
        login, register, logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
