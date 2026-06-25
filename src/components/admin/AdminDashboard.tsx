import { useState, useEffect } from 'react';
import { DollarSign, Clock, TriangleAlert as AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { listExpenses, Expense } from '@/lib/expenses-api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMonthFilter } from '@/hooks/useMonthFilter';

interface AdminDashboardProps {
  onViewAll: () => void;
  onViewInbox: () => void;
}

function MetricCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; color: string; onClick?: () => void;
}) {
  return (
    <Card
      className={cn('border-0 shadow-sm bg-white dark:bg-slate-900', onClick && 'cursor-pointer hover:shadow-md')}
      onClick={onClick}
    >
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

const CATEGORY_DISPLAY: Record<string, string> = {
  MEALS: 'Meals', TRAVEL: 'Travel', ACCOMMODATION: 'Accommodation',
  OFFICE_SUPPLIES: 'Office Supplies', SOFTWARE: 'Software',
  ENTERTAINMENT: 'Entertainment', OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  Meals: '#f97316', Travel: '#3b82f6', Accommodation: '#14b8a6',
  'Office Supplies': '#8b5cf6', Software: '#6366f1', Entertainment: '#ec4899', Other: '#94a3b8',
};

export function AdminDashboard({ onViewAll, onViewInbox }: AdminDashboardProps) {
  const { t } = useApp();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const { year, month, prev, next, inMonth, isCurrentMonth, goTo } = useMonthFilter();

  useEffect(() => {
    listExpenses().then(setAllExpenses);
  }, []);

  const expenses = allExpenses.filter(e => inMonth(e.date));

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter(e => e.status === 'PENDING');
  const flagged = expenses.filter(e => e.status === 'FLAGGED');
  const employeeIds = new Set(expenses.map(e => e.userId));
  const recent = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const byCategory = expenses.reduce((acc, e) => {
    const label = CATEGORY_DISPLAY[e.category] ?? e.category;
    acc[label] = (acc[label] ?? 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCatAmount = Math.max(...categoryEntries.map(([, v]) => v), 1);

  const byEmployee = expenses.reduce((acc, e) => {
    const key = e.userId;
    if (!acc[key]) acc[key] = {
      name: e.user?.name ?? 'Unknown', dept: e.user?.department ?? '',
      total: 0, count: 0, approved: 0, pending: 0, flagged: 0, rejected: 0,
    };
    acc[key].total += e.amount;
    acc[key].count++;
    if (e.status === 'APPROVED') acc[key].approved += e.amount;
    else if (e.status === 'PENDING') acc[key].pending += e.amount;
    else if (e.status === 'FLAGGED') acc[key].flagged += e.amount;
    else if (e.status === 'REJECTED') acc[key].rejected += e.amount;
    return acc;
  }, {} as Record<string, { name: string; dept: string | null; total: number; count: number; approved: number; pending: number; flagged: number; rejected: number }>);

  const employeeList = Object.values(byEmployee).sort((a, b) => b.total - a.total);
  const maxEmpAmount = Math.max(...employeeList.map(e => e.total), 1);
  const topSpenderList = employeeList.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Finance Admin Overview</p>
        </div>
        <MonthPicker year={year} month={month} onPrev={prev} onNext={next} isCurrentMonth={isCurrentMonth} onSelect={goTo} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label={t('totalExpenses')} color="bg-blue-500"
          value={`₪${totalAmount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub="This month" onClick={onViewAll}
        />
        <MetricCard icon={Clock} label={t('pendingApprovals')} color="bg-amber-500"
          value={pending.length.toString()}
          sub={`₪${pending.reduce((s, e) => s + e.amount, 0).toLocaleString()} pending`} onClick={onViewAll}
        />
        <MetricCard icon={AlertTriangle} label={t('flaggedReceipts')} color="bg-red-500"
          value={flagged.length.toString()}
          sub="Need review" onClick={onViewInbox}
        />
        <MetricCard icon={Users} label={t('totalEmployees')} color="bg-emerald-500"
          value={employeeIds.size.toString()}
          sub="Active this month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 lg:col-span-3">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {t('expensesByCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No expenses this month</p>
            ) : categoryEntries.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₪{amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(amount / maxCatAmount) * 100}%`, backgroundColor: categoryColors[cat] || '#94a3b8' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 lg:col-span-2">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              {t('topSpenders')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {topSpenderList.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No expenses this month</p>
            ) : topSpenderList.map((emp, i) => (
              <div key={emp.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.dept} &middot; {emp.count} expenses</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">
                  ₪{emp.total.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            Expenses by Employee
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {employeeList.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No expenses this month</p>
          ) : employeeList.map(emp => (
            <div key={emp.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    {emp.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">{emp.name}</span>
                    <span className="text-xs text-slate-400">{emp.dept} &middot; {emp.count} expense{emp.count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-end shrink-0 ms-4">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    ₪{emp.total.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <div className="flex gap-2 justify-end mt-0.5">
                    {emp.approved > 0 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ ₪{emp.approved.toFixed(0)}</span>}
                    {emp.pending > 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400">⏳ ₪{emp.pending.toFixed(0)}</span>}
                    {emp.flagged > 0 && <span className="text-[10px] text-red-500">⚑ ₪{emp.flagged.toFixed(0)}</span>}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                {emp.approved > 0 && (
                  <div className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${(emp.approved / maxEmpAmount) * 100}%` }} />
                )}
                {emp.pending > 0 && (
                  <div className="h-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${(emp.pending / maxEmpAmount) * 100}%` }} />
                )}
                {emp.flagged > 0 && (
                  <div className="h-full bg-red-400 transition-all duration-700"
                    style={{ width: `${(emp.flagged / maxEmpAmount) * 100}%` }} />
                )}
                {emp.rejected > 0 && (
                  <div className="h-full bg-slate-400 transition-all duration-700"
                    style={{ width: `${(emp.rejected / maxEmpAmount) * 100}%` }} />
                )}
              </div>
            </div>
          ))}
          {employeeList.length > 0 && (
            <div className="flex gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Approved</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pending</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Flagged</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />Rejected</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
            {t('recentActivity')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-blue-600 dark:text-blue-400 gap-1 text-sm">
            {t('viewAll')} <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0 overflow-x-auto">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No expenses this month</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {[t('employee'), t('merchant'), t('category'), t('amount'), t('status')].map(h => (
                    <th key={h} className="text-start px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{e.user?.name}</p>
                      <p className="text-xs text-slate-400">{e.user?.department}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{e.merchant}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {CATEGORY_DISPLAY[e.category] ?? e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{e.currency} {e.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
