import { useState } from 'react';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Eye, ZoomIn } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getFlaggedExpenses, Expense } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ReviewAction = 'approved' | 'rejected' | null;

interface ReviewState {
  action: ReviewAction;
  notes: string;
  resolved: boolean;
}

const flagReasonColors = {
  Unreadable: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  Blurry: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  Torn: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
};

export function ManualReviewInbox() {
  const { t } = useApp();
  const flagged = getFlaggedExpenses();
  const [reviews, setReviews] = useState<Record<string, ReviewState>>(
    Object.fromEntries(flagged.map(e => [e.id, { action: null, notes: '', resolved: false }]))
  );
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  function setAction(id: string, action: ReviewAction) {
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], action } }));
  }

  function setNotes(id: string, notes: string) {
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  }

  function submitReview(id: string) {
    setReviews(prev => ({ ...prev, [id]: { ...prev[id], resolved: true } }));
  }

  const pending = flagged.filter(e => !reviews[e.id]?.resolved);
  const resolved = flagged.filter(e => reviews[e.id]?.resolved);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reviewTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('reviewSubtitle')}</p>
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
          const flagColor = flagReasonColors[expense.flagReason || 'Unreadable'];

          return (
            <Card key={expense.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-0 pt-4 px-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {expense.employeeName.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{expense.employeeName}</p>
                      <p className="text-xs text-slate-400">{expense.department} &middot; {expense.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs border', flagColor)}>
                      <AlertTriangle className="h-3 w-3 me-1" />
                      {expense.flagReason}
                    </Badge>
                    <span className="font-bold text-slate-900 dark:text-white">${expense.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {t('reviewOriginalReceipt')}
                    </p>
                    {expense.receiptUrl ? (
                      <div className="relative group">
                        <img
                          src={expense.receiptUrl}
                          alt="Receipt"
                          className={cn(
                            'w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 transition-all',
                            expense.flagReason === 'Blurry' && 'blur-[2px]',
                            expense.flagReason === 'Torn' && 'opacity-60'
                          )}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setZoomImage(expense.receiptUrl || null)}
                            className="bg-white/90 rounded-full p-2 shadow-lg"
                          >
                            <ZoomIn className="h-5 w-5 text-slate-700" />
                          </button>
                        </div>
                        <div className={cn('absolute inset-0 rounded-xl flex items-center justify-center pointer-events-none', flagColor, 'bg-opacity-40')}>
                          <Badge className={cn('text-sm border font-bold opacity-90', flagColor)}>
                            {expense.flagReason?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <Eye className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                        <p className="text-xs text-slate-400 mb-0.5">{t('merchant')}</p>
                        <p className="font-medium text-slate-900 dark:text-white truncate">{expense.merchant}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                        <p className="text-xs text-slate-400 mb-0.5">{t('category')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{expense.category}</p>
                      </div>
                    </div>
                  </div>

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
                            review.action === 'approved'
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
                            review.action === 'rejected'
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
                        value={review.notes}
                        onChange={e => setNotes(expense.id, e.target.value)}
                        placeholder="Add review notes..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      onClick={() => submitReview(expense.id)}
                      disabled={!review.action}
                      className={cn(
                        'w-full h-10 font-semibold transition-all',
                        review.action === 'approved' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                        review.action === 'rejected' && 'bg-red-600 hover:bg-red-700 text-white',
                        !review.action && 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      {review.action ? `Submit: ${review.action.charAt(0).toUpperCase() + review.action.slice(1)}` : 'Select an action'}
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
                    <p className="text-xs text-slate-400">{expense.employeeName} &middot; ${expense.amount.toFixed(2)}</p>
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
