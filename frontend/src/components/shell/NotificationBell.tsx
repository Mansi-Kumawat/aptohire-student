import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { NotificationItem } from '@/lib/domain/types';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';

interface NotificationBellProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const latest8 = notifications.slice(0, 8);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="relative w-10 h-10 rounded-control flex items-center justify-center text-ink hover:bg-canvas/80 focus-visible:outline-none transition-colors"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell className="w-5 h-5 stroke-[1.75]" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember-500 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ember-500" />
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 rounded-panel border border-hairline bg-canvas p-0 shadow-float focus:outline-none"
        >
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-base text-ink">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-ember-100 text-ember-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-verdant-700 hover:text-verdant-800 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-hairline">
            {latest8.length === 0 ? (
              <div className="p-8 text-center text-moss text-sm">
                You're all caught up.
              </div>
            ) : (
              latest8.map((notif) => (
                <Link
                  key={notif.id}
                  to={notif.link}
                  onClick={() => {
                    onMarkRead(notif.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'block p-3.5 text-left transition-colors hover:bg-mist/80',
                    !notif.read_at && 'bg-verdant-50/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-ink line-clamp-1">
                      {notif.title}
                    </span>
                    <span className="text-[11px] text-moss shrink-0">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-moss line-clamp-2 leading-relaxed">
                    {notif.body}
                  </p>
                </Link>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-hairline bg-mist/50 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-ink hover:text-verdant-700 inline-flex items-center gap-1.5 py-1"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
