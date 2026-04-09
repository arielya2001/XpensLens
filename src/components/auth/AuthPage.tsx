import { useState } from 'react';
import { Eye, EyeOff, Zap, Shield, TrendingUp, Sun, Moon, Globe } from 'lucide-react';
import { useApp, MOCK_EMPLOYEES, MOCK_ADMIN } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function AuthPage() {
  const { t, theme, toggleTheme, toggleLanguage, language, setUser, dir } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', confirm: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (role === 'admin') {
        setUser(MOCK_ADMIN);
      } else {
        setUser({ ...MOCK_EMPLOYEES[0] });
      }
      setLoading(false);
    }, 800);
  }

  const features = [
    { icon: Zap, label: 'AI Receipt Scanning', sub: 'Extract data instantly' },
    { icon: Shield, label: 'Policy Compliance', sub: 'Automated rule checks' },
    { icon: TrendingUp, label: 'Real-time Analytics', sub: 'Spending insights' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col" dir={dir}>
      <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
        <Button variant="ghost" size="icon" onClick={toggleLanguage} className="text-slate-600 dark:text-slate-300">
          <Globe className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-600 dark:text-slate-300">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-2 py-1">
          {language.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-1 min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden flex-col justify-center items-center p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-slate-900/80" />
          <div className="absolute top-20 start-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 end-10 w-80 h-80 bg-blue-300/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-md text-center text-white">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-white font-black text-xl">X</span>
              </div>
              <span className="font-black text-3xl tracking-tight">{t('appName')}</span>
            </div>
            <h2 className="text-3xl font-bold mb-3 leading-tight">
              {t('appTagline')}
            </h2>
            <p className="text-blue-200 text-sm mb-12 leading-relaxed">
              Streamline your entire expense workflow with the power of Vision AI. Submit, track, and approve in seconds.
            </p>

            <div className="space-y-4">
              {features.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4 text-start">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-blue-200 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <span className="text-white font-black text-base">X</span>
              </div>
              <span className="font-black text-2xl text-slate-900 dark:text-white">{t('appName')}</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? t('loginTitle') : t('registerTitle')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 block">
                {t('loginRoleLabel')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {(['employee', 'admin'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                      role === r
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      role === r ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'
                    )}>
                      {r === 'employee' ? (
                        <TrendingUp className={cn('h-5 w-5', role === r ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
                      ) : (
                        <Shield className={cn('h-5 w-5', role === r ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400')} />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-semibold',
                      role === r ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'
                    )}>
                      {r === 'employee' ? t('loginAsEmployee') : t('loginAsAdmin')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">{t('fullName')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="h-11"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={role === 'admin' ? 'admin@company.com' : 'you@company.com'}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="h-11 pe-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute inset-y-0 end-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-sm font-medium">{t('confirmPassword')}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    className="h-11"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200 dark:shadow-none transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t('loading')}
                  </span>
                ) : (
                  mode === 'login' ? t('loginBtn') : t('registerBtn')
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
              </button>
            </p>

            <div className="text-center">
              <p className="text-xs text-slate-400 dark:text-slate-600">
                Demo: Click "Sign In" with any credentials
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
