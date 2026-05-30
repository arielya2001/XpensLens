import { useState, useEffect } from 'react';
import { Clock, Circle as XCircle, CircleCheck as CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { listExpenses, Expense } from '@/lib/expenses-api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMonthFilter } from '@/hooks/useMonthFilter';

interface EmployeeDashboardProps {
  onAddExpense: () => void;
  onViewAll: () => void;
  refreshKey?: number;
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const categoryColors: Record<string, string> = {
  MEALS: 'bg-orange-400', TRAVEL: 'bg-blue-400', ACCOMMODATION: 'bg-teal-400',
  OFFICE_SUPPLIES: 'bg-purple-400', SOFTWARE: 'bg-indigo-400',
  ENTERTAINMENT: 'bg-pink-400', OTHER: 'bg-slate-400',
};

export function EmployeeDashboard({ onAddExpense, onViewAll, refreshKey }: EmployeeDashboardProps) {
  const { t, user } = useApp();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const { year, month, prev, next, inMonth, isCurrentMonth } = useMonthFilter();

  useEffect(() => {
    listExpenses().then(setAllExpenses);
  }, [refreshKey]);

  const expenses = allExpenses.filter(e => inMonth(e.date));

  const approved = expenses.filter(e => e.status === 'APPROVED');
  const pending = expenses.filter(e => e.status === 'PENDING' || e.status === 'FLAGGED');
  const rejected = expenses.filter(e => e.status === 'REJECTED');
  const recent = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const metrics = [
    {
      icon: CheckCircle, label: t('totalApproved'), color: 'bg-emerald-500',
      value: `₪${approved.reduce((s, e) => s + e.amount, 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: t('thisMonth'),
    },
    {
      icon: Clock, label: t('pendingReview'), color: 'bg-amber-500',
      value: pending.length.toString(),
      sub: `₪${pending.reduce((s, e) => s + e.amount, 0).toLocaleString()} ${t('pending')}`,
    },
    {
      icon: XCircle, label: t('rejected'), color: 'bg-red-500',
      value: rejected.length.toString(),
      sub: t('thisMonth'),
    },
    {
      icon: TrendingUp, label: t('myExpenses'), color: 'bg-blue-500',
      value: expenses.length.toString(),
      sub: 'Total submitted',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Welcome back, {user?.name?.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker year={year} month={month} onPrev={prev} onNext={next} isCurrentMonth={isCurrentMonth} />
          <Button
            onClick={onAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addExpense')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            {t('recentExpenses')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-blue-600 dark:text-blue-400 text-sm">
            {t('viewAll')}
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recent.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">{t('noExpenses')}</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('startByAdding')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map(expense => (
                <div key={expense.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold', categoryColors[expense.category] || 'bg-slate-400')}>
                    {expense.category.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{expense.merchant}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(expense.date).toLocaleDateString()} &middot; {expense.category}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </p>
                    <StatusBadge status={expense.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
