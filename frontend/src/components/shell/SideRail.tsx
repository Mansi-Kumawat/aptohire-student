import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Logo } from '../brand/Logo';
import {
  Home,
  FolderKanban,
  Award,
  Share2,
  FileText,
  User,
  HelpCircle,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface SideRailProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingRequestsCount?: number;
  onNavigate?: () => void;
  onClose?: () => void;
  onSignOut?: () => void;
  userEmail?: string;
  className?: string;
}

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/scorecard', label: 'Scorecard', icon: Award },
  { to: '/sharing', label: 'Sharing', icon: Share2, hasBadge: true },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export const SideRail: React.FC<SideRailProps> = ({
  collapsed = false,
  onToggleCollapse,
  pendingRequestsCount = 0,
  onNavigate,
  onClose,
  onSignOut,
  userEmail,
  className,
}) => {
  return (
    <aside
      className={cn(
        'h-full flex flex-col justify-between bg-canvas border-r border-hairline py-4 select-none transition-all duration-200 overflow-hidden',
        collapsed ? 'w-[72px] px-2 items-center' : 'w-full lg:w-[240px] px-3.5 sm:px-4',
        className
      )}
    >
      <div
        className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Header: Logo and optional Drawer Close button */}
        <div
          className={cn(
            'mb-6 px-1 flex items-center justify-between shrink-0 gap-2 min-w-0 overflow-hidden',
            collapsed && 'justify-center px-0'
          )}
        >
          <NavLink
            to="/"
            onClick={onNavigate}
            aria-label="AptoHire Home"
            className="flex items-center min-w-0 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600 rounded-control overflow-hidden"
          >
            <Logo showPortalBadge={!collapsed} collapsed={collapsed} />
          </NavLink>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation drawer"
              className="w-9 h-9 shrink-0 rounded-control flex items-center justify-center text-moss hover:text-ink hover:bg-mist transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600 lg:hidden"
            >
              <X className="w-5 h-5 stroke-[1.75]" />
            </button>
          )}
        </div>

        {/* Main Nav items */}
        <nav className="space-y-1 flex-1 overflow-x-hidden" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-control text-[14px] font-medium transition-colors min-h-[44px] overflow-hidden',
                    isActive
                      ? 'bg-verdant-50 text-verdant-800 font-semibold'
                      : 'text-moss hover:text-ink hover:bg-mist',
                    collapsed && 'justify-center px-0'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[1.75]" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.hasBadge && pendingRequestsCount > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs font-semibold bg-ember-500 text-white leading-none',
                      collapsed ? 'absolute top-1.5 right-1.5 h-2 w-2 p-0' : 'ml-auto'
                    )}
                    aria-label={`${pendingRequestsCount} pending requests`}
                  >
                    {!collapsed && pendingRequestsCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Rail footer */}
      <div className="pt-3 mt-2 border-t border-hairline space-y-1 shrink-0 overflow-x-hidden">
        <NavLink
          to="/help"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-control text-xs font-medium text-moss hover:text-ink hover:bg-mist transition-colors min-h-[40px]',
              isActive && 'text-ink font-semibold bg-mist',
              collapsed && 'justify-center px-0'
            )
          }
          title={collapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
          {!collapsed && <span className="truncate">Help & support</span>}
        </NavLink>

        <NavLink
          to="/account"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-control text-xs font-medium text-moss hover:text-ink hover:bg-mist transition-colors min-h-[40px]',
              isActive && 'text-ink font-semibold bg-mist',
              collapsed && 'justify-center px-0'
            )
          }
          title={collapsed ? 'Account & Security' : undefined}
        >
          <Shield className="w-4 h-4 shrink-0 stroke-[1.75]" />
          {!collapsed && <span className="truncate">Account & security</span>}
        </NavLink>

        {/* Desktop Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand side navigation' : 'Collapse side navigation'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-control text-xs font-medium text-moss hover:text-ink hover:bg-mist transition-colors min-h-[40px]',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0 stroke-[1.75]" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span className="truncate">Collapse sidebar</span>
              </>
            )}
          </button>
        )}

        {/* Drawer-only user info & sign out */}
        {onSignOut && (
          <div className="pt-2 border-t border-hairline mt-2 lg:hidden">
            {userEmail && (
              <p className="px-3 py-1 text-[11px] text-moss/80 truncate">{userEmail}</p>
            )}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                onSignOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-control text-xs font-medium text-ember-700 hover:bg-ember-50 transition-colors min-h-[40px]"
            >
              <LogOut className="w-4 h-4 shrink-0 stroke-[1.75]" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
