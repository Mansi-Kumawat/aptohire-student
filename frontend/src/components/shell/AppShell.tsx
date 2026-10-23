import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkipLink } from './SkipLink';
import { PrototypeNotice } from './PrototypeNotice';
import { TopBar } from './TopBar';
import { SideRail } from './SideRail';
import { BottomTabBar } from './BottomTabBar';
import { AuthUser } from '@/lib/backend/types';
import { NotificationItem } from '@/lib/domain/types';

interface AppShellProps {
  user: AuthUser;
  avatarUrl?: string | null;
  notifications: NotificationItem[];
  pendingRequestsCount?: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSignOut: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  user,
  avatarUrl,
  notifications,
  pendingRequestsCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSignOut,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on resize to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col antialiased">
      <SkipLink />
      <PrototypeNotice />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Permanent Side Rail (>= 1024px) */}
        <div className="hidden lg:block shrink-0 h-full">
          <SideRail
            collapsed={isRailCollapsed}
            onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
            pendingRequestsCount={pendingRequestsCount}
          />
        </div>

        {/* Mobile & Tablet Side Navigation Drawer (< 1024px) */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <div
              className="relative w-[280px] max-w-[85vw] h-full bg-canvas shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <SideRail
                pendingRequestsCount={pendingRequestsCount}
                onNavigate={() => setDrawerOpen(false)}
                onClose={() => setDrawerOpen(false)}
                onSignOut={onSignOut}
                userEmail={user.email}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopBar
            user={user}
            avatarUrl={avatarUrl}
            notifications={notifications}
            onMarkNotificationRead={onMarkNotificationRead}
            onMarkAllNotificationsRead={onMarkAllNotificationsRead}
            onSignOut={onSignOut}
            isDrawerOpen={drawerOpen}
            onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 focus:outline-none"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (< 768px) for quick thumb navigation */}
      <BottomTabBar
        user={user}
        pendingRequestsCount={pendingRequestsCount}
        onSignOut={onSignOut}
      />
    </div>
  );
};
