import { useState, useEffect } from 'react';
import { Search, Download, ChevronRight, CircleCheck as CheckCircle, Circle as XCircle, Eye, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { listExpenses, updateExpenseStatus, Expense } from '@/lib/expenses-api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MonthPicker } from '@/components/shared/MonthPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useMonthFilter } from '@/hooks/useMonthFilter';

export function AllExpensesView() {
  const { t } = useApp();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [groupByEmp, setGroupByEmp] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const { year, month, prev, next, inMonth, isCurrentMonth } = useMonthFilter();

  useEffect(() => {
    listExpenses()
      .then(data => {
        setAllExpenses(data);
        if (data.length > 0) setExpanded(new Set([data[0].userId]));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusUpdate(expenseId: string, status: 'APPROVED' | 'REJECTED') {
    setUpdating(expenseId);
    try {
      const updated = await updateExpenseStatus(expenseId, status);
      setAllExpenses(prev => prev.map(e => e.id === expenseId ? updated : e));
    } finally {
      setUpdating(null);
    }
  }

  const monthExpenses = allExpenses.filter(e => inMonth(e.date));

  const filtered = monthExpenses.filter(e => {
    const employeeName = e.user?.name ?? '';
    const matchSearch = employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.merchant.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status.toLowerCase() === statusFilter;
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const grouped = filtered.reduce((acc, e) => {
    const key = e.userId;
    if (!acc[key]) {
      acc[key] = { name: e.user?.name ?? 'Unknown', dept: e.user?.department ?? '', expenses: [] };
    }
    acc[key].expenses.push(e);
    return acc;
  }, {} as Record<string, { name: string; dept: string | null; expenses: Expense[] }>);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCSV() {
    const rows = [
      ['Employee', 'Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Status'],
      ...filtered.map(e => [
        e.user?.name ?? '',
        new Date(e.date).toLocaleDateString(),
        e.merchant,
        e.category,
        e.amount.toFixed(2),
        e.currency,
        e.status,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const categories = [...new Set(allExpenses.map(e => e.category))];

  return (
    <>
    <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Expense Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
          </div>
        </DialogHeader>
        {selected && (
          <div className="space-y-3 text-sm">
            {[
              ['Employee', selected.user?.name],
              ['Merchant', selected.merchant],
              ['Amount', `${selected.currency} ${selected.amount.toFixed(2)}`],
              ['Date', new Date(selected.date).toLocaleDateString()],
              ['Category', selected.category],
              ['Status', <StatusBadge key="s" status={selected.status} />],
              ...(selected.notes ? [['Notes', selected.notes]] : []),
              ...(selected.flagReason ? [['Flag Reason', selected.flagReason]] : []),
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-500 shrink-0">{label}</span>
                <span className="font-medium text-slate-900 dark:text-white text-end">{value}</span>
              </div>
            ))}
            <div className="pt-1">
              <p className="text-slate-500 mb-2">Receipt</p>
              {selected.receiptUrl ? (
                <div className="space-y-2">
                  <img
                    src={selected.receiptUrl}
                    alt="Receipt"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 object-contain max-h-52"
                  />
                  <a href={selected.receiptUrl} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Download className="h-3.5 w-3.5" />
                      Download Receipt
                    </Button>
                  </a>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No receipt uploaded</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('allExpensesTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('showing')} {filtered.length} {t('of')} {monthExpenses.length} {t('entries')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker year={year} month={month} onPrev={prev} onNext={next} isCurrentMonth={isCurrentMonth} />
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            {t('exportCSV')}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">{t('approved')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                <SelectItem value="flagged">{t('flagged')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder={t('filterCategory')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={groupByEmp ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupByEmp(v => !v)}
              className={cn('gap-2 shrink-0', groupByEmp && 'bg-blue-600 hover:bg-blue-700')}
            >
              {t('groupByEmployee')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">{t('loading')}</div>
          ) : groupByEmp ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(grouped).map(([empId, { name, dept, expenses: empExpenses }]) => {
                const isExpanded = expanded.has(empId);
                const totalAmt = empExpenses.reduce((s, e) => s + e.amount, 0);
                const pendingCnt = empExpenses.filter(e => e.status === 'PENDING' || e.status === 'FLAGGED').length;

                return (
                  <div key={empId}>
                    <button
                      onClick={() => toggleExpand(empId)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-start"
                    >
                      <div className={cn('transition-transform duration-200', isExpanded && 'rotate-90')}>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{name}</p>
                        <p className="text-xs text-slate-400">{dept}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">{empExpenses.length} expenses</span>
                        {pendingCnt > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
                            {pendingCnt} {t('pending')}
                          </Badge>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          ₪{totalAmt.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                              {[t('date'), t('merchant'), t('category'), t('amount'), t('status'), t('actions')].map(h => (
                                <th key={h} className="text-start px-5 py-2.5 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider first:ps-14">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {empExpenses.map(expense => (
                              <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="ps-14 pe-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {new Date(expense.date).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{expense.merchant}</td>
                                <td className="px-5 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {expense.category}
                                  </span>
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                  {expense.currency} {expense.amount.toFixed(2)}
                                </td>
                                <td className="px-5 py-3"><StatusBadge status={expense.status} /></td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-1">
                                    {(expense.status === 'PENDING' || expense.status === 'FLAGGED') && (
                                      <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                          disabled={updating === expense.id} onClick={() => handleStatusUpdate(expense.id, 'APPROVED')}>
                                          <CheckCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                          disabled={updating === expense.id} onClick={() => handleStatusUpdate(expense.id, 'REJECTED')}>
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" onClick={() => setSelected(expense)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(grouped).length === 0 && (
                <div className="text-center py-12 text-slate-400">No expenses this month</div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {[t('employee'), t('date'), t('merchant'), t('category'), t('amount'), t('status'), t('actions')].map(h => (
                      <th key={h} className="text-start px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">No expenses this month</td></tr>
                  ) : filtered.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{expense.user?.name}</p>
                        <p className="text-xs text-slate-400">{expense.user?.department}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{expense.merchant}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{expense.category}</span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{expense.currency} {expense.amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={expense.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {(expense.status === 'PENDING' || expense.status === 'FLAGGED') && (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                disabled={updating === expense.id} onClick={() => handleStatusUpdate(expense.id, 'APPROVED')}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                disabled={updating === expense.id} onClick={() => handleStatusUpdate(expense.id, 'REJECTED')}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" onClick={() => setSelected(expense)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
