import React from 'react';
import { BloodGroup } from '@prisma/client';
import { formatBloodGroup } from '@/lib/blood-compatibility';
import { cn } from '@/lib/utils';

interface BloodGroupBadgeProps {
  group: BloodGroup;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BloodGroupBadge({
  group,
  className,
  size = 'md',
}: BloodGroupBadgeProps) {
  // Color styling based on blood group (visual highlighting)
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-full select-none transition-colors border";
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  // Group styling (e.g. Red for O-, AB+ standard etc.)
  const groupStyles: Record<BloodGroup, string> = {
    [BloodGroup.O_NEG]: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900", // Universal Donor
    [BloodGroup.O_POS]: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950 dark:text-red-400 dark:border-red-950",
    [BloodGroup.A_NEG]: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
    [BloodGroup.A_POS]: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-950",
    [BloodGroup.B_NEG]: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
    [BloodGroup.B_POS]: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-950",
    [BloodGroup.AB_NEG]: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-900",
    [BloodGroup.AB_POS]: "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-950", // Universal Receiver
  };

  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        groupStyles[group],
        className
      )}
    >
      {formatBloodGroup(group)}
    </span>
  );
}
