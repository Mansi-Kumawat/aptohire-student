import React from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className }) => {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-6 border-b border-hairline overflow-x-auto no-scrollbar', className)}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative py-3 text-[15px] font-medium whitespace-nowrap transition-colors flex items-center gap-2 select-none min-h-[44px]',
              isActive ? 'text-ink font-semibold' : 'text-moss hover:text-ink'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-[12px] px-2 py-0.5 rounded-full font-medium',
                  isActive
                    ? 'bg-verdant-100 text-verdant-800'
                    : 'bg-mist text-moss border border-hairline'
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-verdant-700 rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
