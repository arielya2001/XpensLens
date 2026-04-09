import { LayoutDashboard, Receipt, Upload, Users, Settings, TriangleAlert as AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getFlaggedExpenses, getPendingExpenses } from '@/data/mockData';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
  employeeOnly?: boolean;
}

const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { key: 'my-expenses', labelKey: 'myExpenses', icon: Receipt, employeeOnly: true },
  { key: 'all-expenses', labelKey: 'allExpenses', icon: Users, adminOnly: true },
  { key: 'policy-engine', labelKey: 'policyEngine', icon: Shield, adminOnly: true },
  { key: 'manual-review', labelKey: 'manualReview', icon: AlertTriangle, adminOnly: true },
  { key: 'settings', labelKey: 'settings', icon: Settings },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t, user, activeView, setActiveView, dir } = useApp();
  const flaggedCount = getFlaggedExpenses().length;
  const pendingCount = getPendingExpenses().length;

  function handleNav(key: string) {
    setActiveView(key);
    onClose();
  }

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.employeeOnly && user?.role !== 'employee') return false;
    return true;
  });

  const getBadge = (key: string) => {
    if (key === 'manual-review') return flaggedCount;
    if (key === 'all-expenses') return pendingCount;
    return 0;
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-16 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:top-0 md:h-full',
          open ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="hidden md:flex items-center gap-2 h-16 px-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
            {t('appName')}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {filteredItems.map(item => {
              const Icon = item.icon;
              const badge = getBadge(item.key);
              const isActive = activeView === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-600 dark:text-blue-400' : '')} />
                  <span className="flex-1 text-start">{t(item.labelKey as Parameters<typeof t>[0])}</span>
                  {badge > 0 && (
                    <Badge className="h-5 min-w-5 px-1 text-[10px] bg-amber-500 hover:bg-amber-500 border-0">
                      {badge}
                    </Badge>
                  )}
                  {isActive && <ChevronRight className="h-3 w-3 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 px-2">
            <div className={cn(
              'w-2 h-2 rounded-full animate-pulse',
              user?.role === 'admin' ? 'bg-green-500' : 'bg-blue-500'
            )} />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.role === 'admin' ? t('loginAsAdmin') : t('loginAsEmployee')} &mdash; {user?.department}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
