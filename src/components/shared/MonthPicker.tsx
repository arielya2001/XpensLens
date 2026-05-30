import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthPickerProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  isCurrentMonth: boolean;
}

export function MonthPicker({ year, month, onPrev, onNext, isCurrentMonth }: MonthPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" onClick={onPrev} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">
        {MONTHS[month]} {year}
      </span>
      <Button variant="outline" size="icon" onClick={onNext} disabled={isCurrentMonth} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
