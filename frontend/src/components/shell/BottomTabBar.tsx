import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Home, FolderKanban, Award, Share2, MoreHorizontal } from 'lucide-react';
import { MoreSheet } from './MoreSheet';
import { AuthUser } from '@/lib/backend/types';

interface BottomTabBarProps {
  user: AuthUser;
  pendingRequestsCount?: number;
  onSignOut: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  user,
  pendingRequestsCount = 0,
  onSignOut,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/scorecard', label: 'Scorecard', icon: Award },
    { to: '/sharing', label: 'Sharing', icon: Share2, hasBadge: true },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-canvas/95 backdrop-blur border-t border-hairline safe-bottom md:hidden select-none"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.exact}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-[11px] font-medium transition-colors',
                    isActive ? 'text-verdant-800 font-semibold' : 'text-moss hover:text-ink'
                  )
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                  {tab.hasBadge && pendingRequestsCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-ember-500"
                      aria-label={`${pendingRequestsCount} pending requests`}
                    />
                  )}
                </div>
                <span className="mt-0.5">{tab.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-[11px] font-medium text-moss hover:text-ink transition-colors"
            aria-label="Open more menu"
          >
            <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
            <span className="mt-0.5">More</span>
          </button>
        </div>
      </nav>

      <MoreSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        user={user}
        onSignOut={onSignOut}
      />
    </>
  );
};
