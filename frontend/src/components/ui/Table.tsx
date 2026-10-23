import React from 'react';
import { cn } from '@/lib/cn';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'w-full overflow-x-auto overflow-y-hidden border border-hairline rounded-panel bg-canvas',
          wrapperClassName
        )}
      >
        <table ref={ref} className={cn('w-full text-left text-[14px] border-collapse', className)} {...props}>
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-mist text-moss font-medium border-b border-hairline sticky top-0 z-10', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('divide-y divide-hairline', className)} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('transition-colors hover:bg-mist/70', className)}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('px-4 py-3.5 text-[13px] font-semibold text-moss tracking-tight whitespace-nowrap', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3.5 align-middle text-ink', className)} {...props} />
));
TableCell.displayName = 'TableCell';
