import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AuthUser } from '@/lib/backend/types';
import { ChevronDown, User, Shield, LogOut, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccountMenuProps {
  user: AuthUser;
  avatarUrl?: string | null;
  onSignOut: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  avatarUrl,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  const displayName = user.full_name || user.email.split('@')[0];

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1.5 pl-2 rounded-control hover:bg-canvas/80 text-ink focus-visible:outline-none transition-colors select-none"
          aria-label="Account menu"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-hairline"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-verdant-100 text-verdant-800 flex items-center justify-center font-semibold text-xs border border-verdant-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:inline">
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-moss" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 rounded-panel border border-hairline bg-canvas p-1.5 shadow-float focus:outline-none"
        >
          <div className="px-3 py-2 border-b border-hairline mb-1">
            <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
            <p className="text-xs text-moss truncate">{user.email}</p>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none"
            >
              <User className="w-4 h-4 text-moss" />
              <span>Profile</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none"
            >
              <Shield className="w-4 h-4 text-moss" />
              <span>Account & security</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-hairline my-1" />

          <DropdownMenu.Item
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-verdant-800 rounded-control hover:bg-verdant-50 cursor-pointer focus:bg-verdant-50 focus:outline-none"
          >
            <Users className="w-4 h-4 text-verdant-700" />
            <span>Switch demo persona</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger-600 rounded-control hover:bg-danger-50 cursor-pointer focus:bg-danger-50 focus:outline-none"
          >
            <LogOut className="w-4 h-4 text-danger-600" />
            <span>Sign out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
