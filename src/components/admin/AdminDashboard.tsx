import { DollarSign, Clock, TriangleAlert as AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getAdminSummary, mockExpenses } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

const categoryColors: Record<string, string> = {
  Meals: '#f97316', Travel: '#3b82f6', Accommodation: '#14b8a6',
  'Office Supplies': '#8b5cf6', Software: '#6366f1', Entertainment: '#ec4899', Other: '#94a3b8',
};

export function AdminDashboard({ onViewAll, onViewInbox }: AdminDashboardProps) {
  const { t } = useApp();
  const summary = getAdminSummary();
  const recent = mockExpenses.slice(0, 6);

  const categoryEntries = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCatAmount = Math.max(...categoryEntries.map(([, v]) => v));

  const topSpenders = mockExpenses.reduce((acc, e) => {
    const key = e.employeeId;
    if (!acc[key]) acc[key] = { name: e.employeeName, dept: e.department, total: 0, count: 0 };
    acc[key].total += e.amount;
    acc[key].count++;
    return acc;
  }, {} as Record<string, { name: string; dept: string; total: number; count: number }>);

  const topSpenderList = Object.values(topSpenders).sort((a, b) => b.total - a.total).slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Finance Admin Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label={t('totalExpenses')} color="bg-blue-500"
          value={`$${summary.totalAmount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          sub="All time" onClick={onViewAll}
        />
        <MetricCard icon={Clock} label={t('pendingApprovals')} color="bg-amber-500"
          value={summary.pendingCount.toString()}
          sub={`$${summary.pendingAmount.toLocaleString()} pending`} onClick={onViewAll}
        />
        <MetricCard icon={AlertTriangle} label={t('flaggedReceipts')} color="bg-red-500"
          value={summary.flaggedCount.toString()}
          sub="Need review" onClick={onViewInbox}
        />
        <MetricCard icon={Users} label={t('totalEmployees')} color="bg-emerald-500"
          value={summary.employeeCount.toString()}
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
            {categoryEntries.map(([cat, amount]) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(amount / maxCatAmount) * 100}%`,
                      backgroundColor: categoryColors[cat] || '#94a3b8',
                    }}
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
            {topSpenderList.map((emp, i) => (
              <div key={emp.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.dept} &middot; {emp.count} expenses</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">
                  ${emp.total.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {[t('employee'), t('merchant'), t('category'), t('amount'), t('status')].map(h => (
                  <th key={h} className="text-start px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(e => (
                <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 dark:text-white">{e.employeeName}</p>
                    <p className="text-xs text-slate-400">{e.department}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{e.merchant}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">${e.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
