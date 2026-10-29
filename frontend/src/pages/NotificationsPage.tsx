import React, { useState, useEffect } from 'react';
import { useBackend } from '@/lib/backend';
import { env } from '@/config/env';
import { useAuth } from '@/features/auth/useAuth';
import { NotificationItem } from '@/lib/domain/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/common/BackButton';
import { formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export const NotificationsPage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      backend.notifications.listNotifications(user.id)
        .then((notifs) => setNotifications(notifs))
        .catch((error) => {
          console.error('Failed to load notifications', error);
          setNotifications([]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [backend, user]);

  const handleMarkAllRead = async () => {
    if (!user || !env.VITE_USE_MOCKS) return;
    try {
      await backend.notifications.markAllNotificationsRead(user.id);
      const updated = await backend.notifications.listNotifications(user.id);
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!env.VITE_USE_MOCKS) return;
    try {
      await backend.notifications.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Group notifications into Today and Earlier
  const today = new Date().toDateString();
  const todayItems = notifications.filter(
    (n) => new Date(n.created_at).toDateString() === today
  );
  const earlierItems = notifications.filter(
    (n) => new Date(n.created_at).toDateString() !== today
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 antialiased pb-16">
      <Helmet>
        <title>Notifications · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton to="/" label="Back to dashboard" className="mb-2" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            Notifications
          </h1>
          <p className="text-moss text-[15px] mt-0.5">
            Real-time updates regarding project audits, access requests, and affiliations
          </p>
        </div>

        {env.VITE_USE_MOCKS && unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-1.5" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {!env.VITE_USE_MOCKS && unreadCount > 0 && (
        <p className="text-xs text-moss">
          Notifications are read-only in the connected backend; unread status is preserved.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-moss" />}
          description="You're all caught up."
        />
      ) : (
        <div className="space-y-6">
          {todayItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-moss">
                Today
              </h2>
              <div className="divide-y divide-hairline border border-hairline rounded-panel bg-canvas">
                {todayItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={() => handleMarkRead(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {earlierItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-moss">
                Earlier
              </h2>
              <div className="divide-y divide-hairline border border-hairline rounded-panel bg-canvas">
                {earlierItems.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onMarkRead={() => handleMarkRead(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NotificationRow: React.FC<{
  item: NotificationItem;
  onMarkRead: () => void;
}> = ({ item, onMarkRead }) => {
  return (
    <Link
      to={item.link}
      onClick={onMarkRead}
      className={cn(
        'p-4 flex items-start justify-between gap-4 transition-colors hover:bg-mist/70 block',
        !item.read_at && 'bg-verdant-50/30'
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {!item.read_at && (
            <span className="w-2 h-2 rounded-full bg-ember-500 shrink-0" />
          )}
          <h3 className="font-semibold text-sm text-ink">{item.title}</h3>
        </div>
        <p className="text-xs text-moss leading-relaxed">{item.body}</p>
        <span className="text-[11px] text-moss/70 block font-mono">
          {formatDate(item.created_at)}
        </span>
      </div>

      <ArrowRight className="w-4 h-4 text-moss shrink-0 mt-1" />
    </Link>
  );
};

export default NotificationsPage;
