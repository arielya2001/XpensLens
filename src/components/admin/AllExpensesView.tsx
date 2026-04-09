import { useState } from 'react';
import { Search, Download, ChevronDown, ChevronRight, CircleCheck as CheckCircle, Circle as XCircle, Eye } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { mockExpenses, Expense } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AllExpensesView() {
  const { t } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['emp1']));
  const [groupByEmp, setGroupByEmp] = useState(true);

  const filtered = mockExpenses.filter(e => {
    const matchSearch = e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.merchant.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const grouped = filtered.reduce((acc, e) => {
    const key = e.employeeId;
    if (!acc[key]) acc[key] = { name: e.employeeName, dept: e.department, expenses: [] };
    acc[key].expenses.push(e);
    return acc;
  }, {} as Record<string, { name: string; dept: string; expenses: Expense[] }>);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const categories = [...new Set(mockExpenses.map(e => e.category))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('allExpensesTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('showing')} {filtered.length} {t('of')} {mockExpenses.length} {t('entries')}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t('exportCSV')}
        </Button>
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
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder={t('filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">{t('approved')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                <SelectItem value="flagged">{t('flagged')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9">
                <SelectValue placeholder={t('filterCategory')} />
              </SelectTrigger>
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
          {groupByEmp ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(grouped).map(([empId, { name, dept, expenses }]) => {
                const isExpanded = expanded.has(empId);
                const totalAmt = expenses.reduce((s, e) => s + e.amount, 0);
                const pendingCnt = expenses.filter(e => e.status === 'pending').length;

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
                        <span className="text-slate-500">{expenses.length} expenses</span>
                        {pendingCnt > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
                            {pendingCnt} {t('pending')}
                          </Badge>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          ${totalAmt.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            {expenses.map(expense => (
                              <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="ps-14 pe-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{expense.date}</td>
                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{expense.merchant}</td>
                                <td className="px-5 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {expense.category}
                                  </span>
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                  ${expense.amount.toFixed(2)}
                                </td>
                                <td className="px-5 py-3"><StatusBadge status={expense.status} /></td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-1">
                                    {expense.status === 'pending' && (
                                      <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                          <CheckCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500">
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
                  {filtered.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{expense.employeeName}</p>
                        <p className="text-xs text-slate-400">{expense.department}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{expense.date}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{expense.merchant}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{expense.category}</span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">${expense.amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={expense.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {expense.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500">
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
  );
}
