import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ shape = 'text', className = '', ...props }: SkeletonProps) {
  const shapes = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${shapes[shape]} ${className}`}
      {...props}
    />
  );
}
