import { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { listExpenses, Expense } from '@/lib/expenses-api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMonthFilter } from '@/hooks/useMonthFilter';

interface ExpensesListProps {
  onAddExpense: () => void;
  refreshKey?: number;
}

type SortField = 'date' | 'amount' | 'merchant';

export function ExpensesList({ onAddExpense, refreshKey }: ExpensesListProps) {
  const { t } = useApp();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { year, month, prev, next, inMonth, isCurrentMonth, goTo } = useMonthFilter();

  useEffect(() => {
    listExpenses()
      .then(setAllExpenses)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const monthExpenses = allExpenses.filter(e => inMonth(e.date));

  const filtered = monthExpenses
    .filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        e.merchant.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.amount.toString().includes(q) ||
        e.currency.toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q) ||
        new Date(e.date).toLocaleDateString().includes(q);
      const matchStatus = statusFilter === 'all' || e.status.toLowerCase() === statusFilter;
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      if (sortField === 'amount') cmp = a.amount - b.amount;
      if (sortField === 'merchant') cmp = a.merchant.localeCompare(b.merchant);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const categories = [...new Set(allExpenses.map(e => e.category))];

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3 opacity-30" />
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('myExpenses')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('showing')} {filtered.length} {t('of')} {monthExpenses.length} {t('entries')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker year={year} month={month} onPrev={prev} onNext={next} isCurrentMonth={isCurrentMonth} onSelect={goTo} />
          <Button
            onClick={onAddExpense}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addExpense')}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('searchEmployee')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="ps-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder={t('filterStatus')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filterAllStatus')}</SelectItem>
                <SelectItem value="approved">{t('approved')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                <SelectItem value="flagged">{t('flagged')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder={t('filterCategory')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filterAllCategories')}</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-400">{t('loading')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {[
                    { label: t('date'), field: 'date' as SortField },
                    { label: t('merchant'), field: 'merchant' as SortField },
                    { label: t('category'), field: null },
                    { label: t('amount'), field: 'amount' as SortField },
                    { label: t('status'), field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && toggleSort(field)}
                      className={cn(
                        'text-start px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider',
                        field && 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200'
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500">
                      {t('noExpensesMonth')}
                    </td>
                  </tr>
                ) : (
                  filtered.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        {expense.time && <span className="text-xs text-slate-400 ms-1">{expense.time}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{expense.merchant}</p>
                        {expense.notes && <p className="text-xs text-slate-400">{expense.notes}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {expense.currency} {expense.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={expense.status} />
                        {(expense.status === 'REJECTED' || expense.status === 'FLAGGED') && expense.flagReason && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1 max-w-[180px]">{expense.flagReason}</p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
