import { Bell, LogOut, Moon, Sun, Menu, X, Globe } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getFlaggedExpenses, getPendingExpenses } from '@/data/mockData';

interface NavbarProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Navbar({ onMenuToggle, sidebarOpen }: NavbarProps) {
  const { t, theme, toggleTheme, toggleLanguage, language, user, setUser, setActiveView } = useApp();
  const notificationCount = getFlaggedExpenses().length + getPendingExpenses().length;
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  function handleLogout() {
    setUser(null);
    setActiveView('dashboard');
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight hidden sm:block">
            {t('appName')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="relative"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4" />
          <span className="absolute -bottom-0.5 -end-0.5 text-[9px] font-bold bg-blue-600 text-white rounded px-0.5 leading-tight">
            {language.toUpperCase()}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -end-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-500 border-0">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 font-semibold text-sm text-slate-700 dark:text-slate-200">
              {notificationCount} {t('notificationsCount')}
            </div>
            <DropdownMenuSeparator />
            {getFlaggedExpenses().slice(0, 3).map(e => (
              <DropdownMenuItem key={e.id} className="flex flex-col items-start gap-0.5 py-2">
                <span className="text-sm font-medium">{e.merchant}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">{t('flagged')}: {e.flagReason}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user?.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs capitalize">
                {user?.role === 'admin' ? t('loginAsAdmin') : t('loginAsEmployee')}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
              <LogOut className="h-4 w-4 me-2" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
