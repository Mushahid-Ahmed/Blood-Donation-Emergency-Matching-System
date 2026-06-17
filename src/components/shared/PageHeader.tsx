import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6 mb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-shrink-0 items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
          {action}
        </div>
      )}
    </div>
  );
}
