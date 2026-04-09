import { CircleCheck as CheckCircle, Clock, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { ExpenseStatus } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ExpenseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useApp();

  const config = {
    approved: {
      label: t('approved'),
      icon: CheckCircle,
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    },
    pending: {
      label: t('pending'),
      icon: Clock,
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    },
    rejected: {
      label: t('rejected'),
      icon: XCircle,
      classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
    },
    flagged: {
      label: t('flagged'),
      icon: AlertTriangle,
      classes: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800',
    },
  };

  const { label, icon: Icon, classes } = config[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
      classes, className
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
