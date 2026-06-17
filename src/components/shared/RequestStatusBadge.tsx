import React from 'react';
import { RequestStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export default function RequestStatusBadge({
  status,
  className,
}: RequestStatusBadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-colors";

  const statusStyles: Record<RequestStatus, string> = {
    [RequestStatus.PENDING_VERIFICATION]: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900",
    [RequestStatus.VERIFIED]: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    [RequestStatus.ACTIVE]: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
    [RequestStatus.FULFILLED]: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
    [RequestStatus.EXPIRED]: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-850 dark:text-gray-400 dark:border-gray-800",
    [RequestStatus.REJECTED]: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  };

  const labelStyles: Record<RequestStatus, string> = {
    [RequestStatus.PENDING_VERIFICATION]: "Pending Verification",
    [RequestStatus.VERIFIED]: "Verified",
    [RequestStatus.ACTIVE]: "Active & Matching",
    [RequestStatus.FULFILLED]: "Fulfilled",
    [RequestStatus.EXPIRED]: "Expired",
    [RequestStatus.REJECTED]: "Rejected",
  };

  return (
    <span className={cn(baseStyles, statusStyles[status], className)}>
      {labelStyles[status] || status}
    </span>
  );
}
