import React from 'react';
import { cn } from '@/lib/utils';

interface EligibilityBadgeProps {
  isEligible: boolean;
  daysRemaining?: number;
  className?: string;
}

export default function EligibilityBadge({
  isEligible,
  daysRemaining = 0,
  className,
}: EligibilityBadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-colors";

  if (isEligible) {
    return (
      <span className={cn(baseStyles, "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900", className)}>
        Eligible
      </span>
    );
  }

  return (
    <span className={cn(baseStyles, "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900", className)}>
      Ineligible {daysRemaining > 0 ? `(${daysRemaining}d remaining)` : ''}
    </span>
  );
}
