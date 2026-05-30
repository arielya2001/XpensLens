import { useState, useEffect } from 'react';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Eye, ZoomIn, Download, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { listExpenses, updateExpenseStatus, Expense } from '@/lib/expenses-api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ReviewAction = 'approved' | 'rejected' | null;

interface ReviewState {
  action: ReviewAction;
  notes: string;
  resolved: boolean;
}


const CATEGORY_DISPLAY: Record<string, string> = {
  MEALS: 'Meals', TRAVEL: 'Travel', ACCOMMODATION: 'Accommodation',
  OFFICE_SUPPLIES: 'Office Supplies', SOFTWARE: 'Software',
  ENTERTAINMENT: 'Entertainment', OTHER: 'Other',
};

export function ManualReviewInbox() {
  const { t } = useApp();
  const [flagged, setFlagged] = useState<Expense[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listExpenses({ status: 'FLAGGED' }).then(data => {
      setFlagged(data);
      setReviews(Object.fromEntries(data.map(e => [e.id, { action: null, notes: '', resolved: false }])));
    });
  }, []);

  function setAction(id: string, action: ReviewAction) {
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], action } }));
  }

  function setNotes(id: string, notes: string) {
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  }

  async function submitReview(id: string) {
    const review = reviews[id];
    if (!review.action) return;
    const status = review.action === 'approved' ? 'APPROVED' : 'REJECTED';
    await updateExpenseStatus(id, status, review.notes || undefined);
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], resolved: true } }));
  }

  const q = search.toLowerCase();
  const pending = flagged.filter(e =>
    !reviews[e.id]?.resolved &&
    (!q || (e.user?.name ?? '').toLowerCase().includes(q))
  );
  const resolved = flagged.filter(e => reviews[e.id]?.resolved);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reviewTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('reviewSubtitle')}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Filter by employee name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ps-9 h-9"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{pending.length} {t('reviewPending')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{resolved.length} {t('reviewResolved')}</span>
        </div>
      </div>

      {pending.length === 0 && (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">All caught up!</p>
            <p className="text-sm text-slate-400 mt-1">No receipts pending manual review</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {pending.map(expense => {
          const review = reviews[expense.id];
          const receiptSrc = expense.receiptUrl ?? null;

          return (
            <Card key={expense.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-0 pt-4 px-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {(expense.user?.name ?? 'U').split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{expense.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">
                        {expense.user?.department} &middot; {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-xs border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                      <AlertTriangle className="h-3 w-3 me-1" />
                      {expense.flagReason}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_DISPLAY[expense.category] ?? expense.category}
                    </Badge>
                    <StatusBadge status={expense.status} />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: receipt image + details */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('reviewOriginalReceipt')}
                    </p>
                    {receiptSrc ? (
                      <div className="relative group">
                        <img
                          src={receiptSrc}
                          alt="Receipt"
                          className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setZoomImage(receiptSrc)}
                            className="bg-white/90 rounded-full p-2 shadow-lg"
                          >
                            <ZoomIn className="h-5 w-5 text-slate-700" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Eye className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}

                    {receiptSrc && (
                      <a href={receiptSrc} download target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Download className="h-3.5 w-3.5" />
                          Download Receipt
                        </Button>
                      </a>
                    )}

                    {/* Expense details */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2 text-sm">
                      {[
                        [t('merchant'), expense.merchant],
                        [t('category'), CATEGORY_DISPLAY[expense.category] ?? expense.category],
                        [t('amount'), `${expense.currency} ${expense.amount.toFixed(2)}`],
                        [t('date'), new Date(expense.date).toLocaleDateString()],
                        ...(expense.notes ? [[t('uploadNotes'), expense.notes]] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-slate-400 shrink-0">{label}</span>
                          <span className="font-medium text-slate-900 dark:text-white text-end">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: review actions */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {t('reviewOverride')}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setAction(expense.id, 'approved')}
                          className={cn(
                            'flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-semibold transition-all',
                            review?.action === 'approved'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/50'
                          )}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t('reviewApprove')}
                        </button>
                        <button
                          onClick={() => setAction(expense.id, 'rejected')}
                          className={cn(
                            'flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-semibold transition-all',
                            review?.action === 'rejected'
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-300 hover:bg-red-50/50'
                          )}
                        >
                          <XCircle className="h-4 w-4" />
                          {t('reviewReject')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('reviewNotes')}</Label>
                      <Textarea
                        value={review?.notes ?? ''}
                        onChange={e => setNotes(expense.id, e.target.value)}
                        placeholder="Add review notes..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      onClick={() => submitReview(expense.id)}
                      disabled={!review?.action}
                      className={cn(
                        'w-full h-10 font-semibold transition-all',
                        review?.action === 'approved' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                        review?.action === 'rejected' && 'bg-red-600 hover:bg-red-700 text-white',
                        !review?.action && 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      {review?.action
                        ? `Submit: ${review.action.charAt(0).toUpperCase() + review.action.slice(1)}`
                        : 'Select an action'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            {t('reviewResolved')} ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map(expense => (
              <Card key={expense.id} className="border-0 shadow-sm bg-white/50 dark:bg-slate-900/50 opacity-60">
                <CardContent className="p-4 flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{expense.merchant}</p>
                    <p className="text-xs text-slate-400">
                      {expense.user?.name} &middot; {expense.currency} {expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {reviews[expense.id].action === 'approved' ? t('approved') : t('rejected')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-2xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          {zoomImage && (
            <img src={zoomImage} alt="Receipt full view" className="w-full rounded-lg object-contain max-h-[80vh]" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
