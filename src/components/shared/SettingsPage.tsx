import { Moon, Sun, Globe, Bell, Shield, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function SettingsPage() {
  const { t, theme, toggleTheme, language, toggleLanguage, user } = useApp();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold">Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs capitalize">
                {user?.role === 'admin' ? t('loginAsAdmin') : t('loginAsEmployee')}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('fullName')}</Label>
              <Input defaultValue={user?.name} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('email')}</Label>
              <Input defaultValue={user?.email} type="email" className="h-10" />
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t('save')}</Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
          </div>
          <CardDescription className="text-sm text-slate-500 mt-1">Customize how XpensLens looks</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-slate-400" /> : <Sun className="h-4 w-4 text-slate-400" />}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {theme === 'dark' ? t('darkMode') : t('lightMode')}
                </p>
                <p className="text-xs text-slate-400">Toggle between light and dark theme</p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {language === 'en' ? 'English (LTR)' : 'עברית (RTL)'}
                </p>
                <p className="text-xs text-slate-400">Switch interface language and text direction</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="text-xs">
              Switch to {language === 'en' ? 'Hebrew' : 'English'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {[
            { label: 'Expense approved', sub: 'Get notified when your expense is approved', default: true },
            { label: 'Expense rejected', sub: 'Get notified when your expense is rejected', default: true },
            { label: 'Policy reminders', sub: 'Receive periodic reminders about expense policies', default: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Current Password</Label>
            <Input type="password" placeholder="••••••••" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">New Password</Label>
            <Input type="password" placeholder="••••••••" className="h-10" />
          </div>
          <Button variant="outline">{t('save')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
