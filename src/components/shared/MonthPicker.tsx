import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthPickerProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  isCurrentMonth: boolean;
  onSelect?: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onPrev, onNext, isCurrentMonth, onSelect }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const now = new Date();

  function handleOpen(v: boolean) {
    if (v) setPickerYear(year);
    setOpen(v);
  }

  function selectMonth(m: number) {
    onSelect?.(pickerYear, m);
    setOpen(false);
  }

  function isFuture(y: number, m: number) {
    return y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth());
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={onPrev} className="h-8 w-8">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 gap-1.5 px-3 text-sm font-semibold min-w-[140px]">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            {MONTHS_FULL[month]} {year}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="center">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-bold">{pickerYear}</span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              disabled={pickerYear >= now.getFullYear()}
              onClick={() => setPickerYear(y => y + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => {
              const isSelected = pickerYear === year && i === month;
              const disabled = isFuture(pickerYear, i);
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => selectMonth(i)}
                  className={cn(
                    'rounded-md py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : disabled
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={onNext} disabled={isCurrentMonth} className="h-8 w-8">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
