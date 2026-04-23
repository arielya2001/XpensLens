import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Image, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Sparkles, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';
import { BackendExpenseCategory, createExpense, getExpense } from '@/lib/expenses-api';

type UploadStep = 'upload' | 'scanning' | 'form' | 'success' | 'rejected';

interface UploadExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = ['Meals', 'Travel', 'Accommodation', 'Office Supplies', 'Software', 'Entertainment', 'Other'] as const;
const currencies = ['USD', 'EUR', 'GBP', 'ILS', 'JPY', 'CAD'];

const MOCK_EXTRACTED = {
  amount: '87.50',
  currency: 'USD',
  date: new Date().toISOString().split('T')[0],
  merchant: 'The Modern Kitchen',
  category: 'Meals' as typeof categories[number],
  notes: '',
  clientName: '',
};

export function UploadExpenseModal({ open, onClose }: UploadExpenseModalProps) {
  const { t } = useApp();
  const [step, setStep] = useState<UploadStep>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(MOCK_EXTRACTED);
  const [scanProgress, setScanProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() {
    setStep('upload');
    setDragOver(false);
    setPreviewUrl(null);
    setForm(MOCK_EXTRACTED);
    setScanProgress(0);
    setIsSubmitting(false);
    setSubmitError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function simulateScan() {
    setStep('scanning');
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('form'), 300);
          return 100;
        }
        return prev + Math.random() * 18;
      });
    }, 200);
  }

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    simulateScan();
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleUseDemoReceipt() {
    setPreviewUrl('https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400');
    simulateScan();
  }

  function toBackendCategory(category: string): BackendExpenseCategory {
    if (category === 'Meals') return 'meals';
    if (category === 'Travel') return 'travel';
    return 'office_supplies';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const created = await createExpense({
        total_amount: Number.parseFloat(form.amount),
        currency: form.currency.toUpperCase(),
        purchase_date: form.date,
        merchant_name: form.merchant,
        category: toBackendCategory(form.category),
      });

      // Reads back the created record to wire the second initial backend route.
      const fetched = await getExpense(created.id);
      setForm((prev) => ({
        ...prev,
        amount: fetched.total_amount.toString(),
        currency: fetched.currency,
        date: fetched.purchase_date,
        merchant: fetched.merchant_name,
        category: fetched.category === 'meals' ? 'Meals' : fetched.category === 'travel' ? 'Travel' : 'Office Supplies',
      }));
      setStep(fetched.status === 'rejected' ? 'rejected' : 'success');
    } catch (error) {
      const amount = Number.parseFloat(form.amount);
      const isViolation = (form.category === 'Meals' && amount > 75) ||
        (form.category === 'Entertainment' && amount > 200);

      if (error instanceof ApiError && error.status === 501) {
        setSubmitError('Backend endpoint is reachable, but business logic is not implemented yet. Showing demo flow.');
      } else {
        setSubmitError('Could not reach backend. Check backend server and VITE_API_BASE_URL.');
      }

      setTimeout(() => setStep(isViolation ? 'rejected' : 'success'), 300);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{t('uploadTitle')}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="-mt-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
          {step === 'form' && (
            <div className="flex items-center gap-2 mt-3">
              {['upload', 'scanning', 'form'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    i <= ['upload', 'scanning', 'form'].indexOf(step)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  )}>{i + 1}</div>
                  {i < 2 && <div className={cn('h-0.5 w-8', i < ['upload', 'scanning', 'form'].indexOf(step) ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')} />}
                </div>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200',
                  dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{t('uploadDragDrop')}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">{t('uploadOr')}</p>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileInput} />
                <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {t('uploadBrowse')}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:hidden">
                <Button variant="outline" className="gap-2 h-12" onClick={() => fileRef.current?.click()}>
                  <Camera className="h-4 w-4 text-blue-600" />
                  {t('uploadCamera')}
                </Button>
                <Button variant="outline" className="gap-2 h-12" onClick={() => fileRef.current?.click()}>
                  <Image className="h-4 w-4 text-blue-600" />
                  {t('uploadGallery')}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={handleUseDemoReceipt}
                className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Use demo receipt (simulate AI scan)
              </Button>
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-8 text-center space-y-6">
              {previewUrl && (
                <div className="w-32 h-40 mx-auto rounded-xl overflow-hidden border-4 border-blue-100 dark:border-blue-900 shadow-lg">
                  <img src={previewUrl} alt="Receipt" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{t('uploadScanning')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('uploadScanningSubtitle')}</p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Processing...</span>
                  <span>{Math.min(100, Math.round(scanProgress))}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, scanProgress)}%` }}
                  />
                </div>
                <div className="flex gap-2 justify-center mt-3 flex-wrap">
                  {['Detecting text...', 'Reading amounts...', 'Identifying merchant...'].map((item, i) => (
                    <span key={item} className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      scanProgress > i * 30
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    )}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                  {submitError}
                </div>
              )}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('uploadFormTitle')}</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">{t('uploadFormSubtitle')}</p>
                </div>
              </div>

              {previewUrl && (
                <div className="h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('uploadAmount')}</Label>
                  <Input
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    type="number"
                    step="0.01"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('uploadCurrency')}</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('uploadDate')}</Label>
                  <Input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" className="h-10" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('uploadCategory')}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as typeof categories[number] }))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('uploadMerchant')}</Label>
                <Input value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} className="h-10" required />
              </div>

              {form.category === 'Meals' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-sm font-medium">
                    {t('uploadClientName')}
                    <span className="text-xs text-blue-600 dark:text-blue-400 ms-2">{t('uploadClientNameHint')}</span>
                  </Label>
                  <Input
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="e.g. Acme Corporation"
                    className="h-10"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('uploadNotes')}</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                  placeholder="Additional context..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  {t('uploadCancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {isSubmitting ? 'Submitting...' : t('uploadSubmit')}
                </Button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('uploadSuccess')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{t('uploadSuccessMsg')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-start space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('merchant')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.merchant}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('amount')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.currency} {parseFloat(form.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('category')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{form.category}</span>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {t('close')}
              </Button>
            </div>
          )}

          {step === 'rejected' && (
            <div className="py-8 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('uploadRejected')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{t('uploadRejectedMsg')}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl p-4 text-start">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Policy Violation Details:</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Amount ${parseFloat(form.amount).toFixed(2)} exceeds the {form.category} limit.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('form')} className="flex-1">Edit Expense</Button>
                <Button onClick={handleClose} className="flex-1">{t('close')}</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
