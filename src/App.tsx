import { useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/components/auth/AuthPage';
import { EmployeeDashboard } from '@/components/employee/EmployeeDashboard';
import { ExpensesList } from '@/components/employee/ExpensesList';
import { UploadExpenseModal } from '@/components/employee/UploadExpenseModal';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AllExpensesView } from '@/components/admin/AllExpensesView';
import { PolicyEngine } from '@/components/admin/PolicyEngine';
import { ManualReviewInbox } from '@/components/admin/ManualReviewInbox';
import { SettingsPage } from '@/components/shared/SettingsPage';
import { Plus } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, user, activeView, setActiveView } = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);

  if (!isAuthenticated) return <AuthPage />;

  function renderContent() {
    if (user?.role === 'employee') {
      switch (activeView) {
        case 'my-expenses': return <ExpensesList onAddExpense={() => setUploadOpen(true)} />;
        case 'settings': return <SettingsPage />;
        default: return (
          <EmployeeDashboard
            onAddExpense={() => setUploadOpen(true)}
            onViewAll={() => setActiveView('my-expenses')}
          />
        );
      }
    }

    if (user?.role === 'admin') {
      switch (activeView) {
        case 'all-expenses': return <AllExpensesView />;
        case 'policy-engine': return <PolicyEngine />;
        case 'manual-review': return <ManualReviewInbox />;
        case 'settings': return <SettingsPage />;
        default: return (
          <AdminDashboard
            onViewAll={() => setActiveView('all-expenses')}
            onViewInbox={() => setActiveView('manual-review')}
          />
        );
      }
    }

    return null;
  }

  return (
    <AppLayout>
      {renderContent()}

      {user?.role === 'employee' && (
        <>
          <UploadExpenseModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
          {activeView !== 'settings' && (
            <button
              onClick={() => setUploadOpen(true)}
              className="fixed bottom-6 end-6 z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-300/50 dark:shadow-none flex items-center justify-center transition-all hover:scale-110 active:scale-95 md:hidden"
              aria-label="Add expense"
            >
              <Plus className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
