import { useState } from 'react';
import { Plus, Save, Shield, Trash2, CircleCheck as CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { mockPolicyRules, PolicyRule } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categoryOptions = ['Meals', 'Travel', 'Accommodation', 'Office Supplies', 'Software', 'Entertainment', 'Other', 'All'] as const;

export function PolicyEngine() {
  const { t } = useApp();
  const [rules, setRules] = useState<PolicyRule[]>(mockPolicyRules);
  const [saved, setSaved] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PolicyRule>>({
    category: 'Meals', maxAmount: 100, requireReceipt: true, enabled: true, description: '',
  });

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function updateLimit(id: string, val: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, maxAmount: parseFloat(val) || 0 } : r));
  }

  function deleteRule(id: string) {
    setRules(prev => prev.filter(r => r.id !== id));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddRule() {
    if (!newRule.category || !newRule.maxAmount) return;
    const rule: PolicyRule = {
      id: `rule${Date.now()}`,
      category: newRule.category as PolicyRule['category'],
      maxAmount: newRule.maxAmount,
      requireReceipt: newRule.requireReceipt ?? true,
      enabled: newRule.enabled ?? true,
      description: newRule.description || `${newRule.category} policy rule`,
    };
    setRules(prev => [...prev, rule]);
    setShowAdd(false);
    setNewRule({ category: 'Meals', maxAmount: 100, requireReceipt: true, enabled: true, description: '' });
  }

  const blockedCategories = ['Entertainment'];

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
                <Select value={newRule.category} onValueChange={v => setNewRule(r => ({ ...r, category: v as PolicyRule['category'] }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t('policyLimit')}</Label>
                <Input
                  type="number"
                  value={newRule.maxAmount}
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
                <Switch
                  checked={newRule.requireReceipt}
                  onCheckedChange={v => setNewRule(r => ({ ...r, requireReceipt: v }))}
                />
                <Label className="text-sm">Require Receipt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newRule.enabled}
                  onCheckedChange={v => setNewRule(r => ({ ...r, enabled: v }))}
                />
                <Label className="text-sm">{t('policyEnabled')}</Label>
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
            {rules.map(rule => (
              <div key={rule.id} className={cn(
                'flex items-center gap-4 px-5 py-4 transition-opacity',
                !rule.enabled && 'opacity-50'
              )}>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{rule.description}</span>
                    <Badge variant="secondary" className="text-xs">{rule.category}</Badge>
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
                    <span className="absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <Input
                      type="number"
                      value={rule.maxAmount}
                      onChange={e => updateLimit(rule.id, e.target.value)}
                      className="ps-6 h-8 w-24 text-sm"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
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
            These categories are blocked from being submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.filter(c => c !== 'All').map(cat => {
              const isBlocked = blockedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    isBlocked
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                >
                  {cat}
                  {isBlocked && <span className="ms-2">✕</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">Click a category to toggle blocked status</p>
        </CardContent>
      </Card>
    </div>
  );
}
