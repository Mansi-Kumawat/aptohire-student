import React from 'react';
import { cn } from '@/lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse motion-reduce:animate-none rounded-control bg-hairline/70',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
};
