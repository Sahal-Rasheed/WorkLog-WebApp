import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string; // YYYY-MM format
  onMonthSelect: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onMonthSelect }: MonthSelectorProps) {
  const [year, month] = selectedMonth.split('-').map(Number);
  
  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = new Date(year, month - 1);
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newYear = currentDate.getFullYear();
    const newMonth = currentDate.getMonth() + 1;
    onMonthSelect(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-2">
      <Label>Month</Label>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-32 text-center font-medium">
          {formatMonth(year, month)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
