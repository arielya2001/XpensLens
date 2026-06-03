import { useState, useEffect } from 'react';
import { Plus, Save, Shield, Trash2, CircleCheck as CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getPolicyRules, savePolicyRules, parsePolicy, PolicyRule, PolicyData } from '@/lib/policy-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS = ['MEALS', 'TRAVEL', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'SOFTWARE', 'ENTERTAINMENT', 'OTHER'] as const;

const CATEGORY_DISPLAY: Record<string, string> = {
  MEALS: 'Meals', TRAVEL: 'Travel', ACCOMMODATION: 'Accommodation',
  OFFICE_SUPPLIES: 'Office Supplies', SOFTWARE: 'Software',
  ENTERTAINMENT: 'Entertainment', OTHER: 'Other',
};

export function PolicyEngine() {
  const { t } = useApp();
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [softRules, setSoftRules] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PolicyRule>>({
    category: 'MEALS', maxAmount: 100, blocked: false, requireReceipt: true, enabled: true, description: '',
  });

  // NLP state
  const [nlpText, setNlpText] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  const [showNlp, setShowNlp] = useState(false);

  useEffect(() => {
    getPolicyRules().then((data: PolicyData) => {
      setRules(data.rules ?? []);
      setSoftRules(data.softRules ?? []);
      if (data.sourceText) setNlpText(data.sourceText);
    }).catch(() => {});
  }, []);

  async function handleParse() {
    if (!nlpText.trim()) return;
    setNlpLoading(true);
    try {
      const data = await parsePolicy(nlpText);
      setRules(data.rules ?? []);
      setSoftRules(data.softRules ?? []);
    } finally {
      setNlpLoading(false);
    }
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function updateLimit(id: string, val: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, maxAmount: parseFloat(val) || 0 } : r));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function handleSave() {
    await savePolicyRules(rules);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddRule() {
    if (!newRule.category || (!newRule.blocked && !newRule.maxAmount)) return;
    const rule: PolicyRule = {
      id: `rule${Date.now()}`,
      category: newRule.category!,
      maxAmount: newRule.maxAmount ?? 0,
      blocked: newRule.blocked ?? false,
      requireReceipt: newRule.requireReceipt ?? true,
      enabled: newRule.enabled ?? true,
      description: newRule.description || `${CATEGORY_DISPLAY[newRule.category!] ?? newRule.category} policy rule`,
    };
    setRules(prev => [...prev, rule]);
    setShowAdd(false);
    setNewRule({ category: 'MEALS', maxAmount: 100, blocked: false, requireReceipt: true, enabled: true, description: '' });
  }

  const spendingRules = rules.filter(r => !r.blocked);
  const blockedRules = rules.filter(r => r.blocked);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('policyTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('policySubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(v => !v)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('policyAddRule')}
          </Button>
          <Button onClick={handleSave} className={cn('gap-2 transition-all', saved ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700')}>
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? t('success') : t('policySave')}
          </Button>
        </div>
      </div>

      {/* NLP Policy Input */}
      <Card className="border-2 border-violet-200 dark:border-violet-800 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-2 pt-4 px-5">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowNlp(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Define Policy with AI</CardTitle>
            </div>
            {showNlp ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          <CardDescription className="text-sm text-slate-500 mt-1">
            Describe your company policy in plain language — AI will extract the rules
          </CardDescription>
        </CardHeader>
        {showNlp && (
          <CardContent className="px-5 pb-5 space-y-3">
            <Textarea
              value={nlpText}
              onChange={e => setNlpText(e.target.value)}
              placeholder={'Example: Travel expenses up to ₪500 are allowed. Meals up to ₪150 per receipt, receipt required. Entertainment is blocked and always requires manager approval. Flag any expense that seems unrelated to work.'}
              rows={5}
              className="resize-none text-sm"
            />
            <Button
              onClick={handleParse}
              disabled={nlpLoading || !nlpText.trim()}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Sparkles className="h-4 w-4" />
              {nlpLoading ? 'Parsing...' : 'Parse with AI'}
            </Button>
            {softRules.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Soft Rules (AI-judged per receipt)</p>
                <ul className="space-y-1">
                  {softRules.map((r, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                      <span className="text-violet-500 shrink-0">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {showAdd && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-sm bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" /> Add New Rule
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('policyCategory')}</Label>
                <Select value={newRule.category} onValueChange={v => setNewRule(r => ({ ...r, category: v }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{CATEGORY_DISPLAY[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('policyLimit')} (₪)</Label>
                <Input
                  type="number"
                  value={newRule.maxAmount}
                  disabled={!!newRule.blocked}
                  onChange={e => setNewRule(r => ({ ...r, maxAmount: parseFloat(e.target.value) }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={newRule.description}
                  onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))}
                  placeholder="Rule description..."
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch checked={newRule.requireReceipt} onCheckedChange={v => setNewRule(r => ({ ...r, requireReceipt: v }))} />
                <Label className="text-sm">Require Receipt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newRule.blocked} onCheckedChange={v => setNewRule(r => ({ ...r, blocked: v }))} />
                <Label className="text-sm">Always Block</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">{t('cancel')}</Button>
              <Button onClick={handleAddRule} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Add Rule</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Spending Limits</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set maximum allowed amounts per category
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {spendingRules.map(rule => (
              <div key={rule.id} className={cn('flex items-center gap-4 px-5 py-4 transition-opacity', !rule.enabled && 'opacity-50')}>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{rule.description}</span>
                    <Badge variant="secondary" className="text-xs">{CATEGORY_DISPLAY[rule.category] ?? rule.category}</Badge>
                    {rule.requireReceipt && (
                      <Badge className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50">
                        Receipt Required
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Max:</span>
                  <div className="relative">
                    <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₪</span>
                    <Input
                      type="number"
                      value={rule.maxAmount}
                      onChange={e => updateLimit(rule.id, e.target.value)}
                      className="ps-6 h-8 w-24 text-sm"
                    />
                  </div>
                  <Button
                    size="icon" variant="ghost"
                    onClick={() => deleteRule(rule.id)}
                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </span>
            {t('policyBlockedCategories')}
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-1">
            These categories are always sent to Manual Review
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {blockedRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-1">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium border bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                  {CATEGORY_DISPLAY[rule.category] ?? rule.category}
                  <button onClick={() => deleteRule(rule.id)} className="ms-2 hover:opacity-70">✕</button>
                </span>
              </div>
            ))}
            {blockedRules.length === 0 && (
              <p className="text-sm text-slate-400">No blocked categories</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">Add a rule with "Always Block" to block a category</p>
        </CardContent>
      </Card>
    </div>
  );
}
