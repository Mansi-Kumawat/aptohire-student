import React from 'react';
import { AuthUser } from '@/lib/backend/types';
import { NotificationItem } from '@/lib/domain/types';
import { NotificationBell } from './NotificationBell';
import { AccountMenu } from './AccountMenu';
import { Menu, X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Link } from 'react-router-dom';

interface TopBarProps {
  user: AuthUser;
  avatarUrl?: string | null;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSignOut: () => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  avatarUrl,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
  isDrawerOpen,
  onToggleDrawer,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-dawn border-b border-hairline safe-top select-none">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between">
        {/* Left: Drawer toggle on mobile & tablet (< 1024px) + Logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger button visible on ALL screens < 1024px */}
          <button
            type="button"
            onClick={onToggleDrawer}
            aria-expanded={isDrawerOpen}
            aria-label={isDrawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            className="w-[44px] h-[44px] rounded-control flex items-center justify-center text-ink hover:bg-canvas/60 active:bg-canvas/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600 transition-colors lg:hidden"
          >
            {isDrawerOpen ? (
              <X className="w-5 h-5 stroke-[1.75]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[1.75]" />
            )}
          </button>

          {/* Logo visible on screens (< 1024px) where desktop side rail is hidden */}
          <div className="lg:hidden flex items-center">
            <Link to="/" aria-label="AptoHire Home" className="flex items-center">
              <Logo showPortalBadge={false} size="sm" />
            </Link>
          </div>
        </div>

        {/* Right side: Notifications bell & AccountMenu */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationBell
            notifications={notifications}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
          />
          <AccountMenu
            user={user}
            avatarUrl={avatarUrl}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
};
