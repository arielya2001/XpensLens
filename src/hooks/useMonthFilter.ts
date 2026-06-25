import { useState } from 'react';

export function useMonthFilter() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function next() {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth())) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function inMonth(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  }

  const isCurrentMonth = (() => {
    const n = new Date();
    return year === n.getFullYear() && month === n.getMonth();
  })();

  function goTo(y: number, m: number) {
    const n = new Date();
    if (y > n.getFullYear() || (y === n.getFullYear() && m > n.getMonth())) return;
    setYear(y);
    setMonth(m);
  }

  return { year, month, prev, next, inMonth, isCurrentMonth, goTo };
}
