import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Link } from 'react-router-dom';
import { User, FileText, HelpCircle, Shield, LogOut } from 'lucide-react';
import { AuthUser } from '@/lib/backend/types';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onSignOut: () => void;
}

export const MoreSheet: React.FC<MoreSheetProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="p-6">
        <SheetHeader className="mb-4">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 pb-6">
          <Link
            to="/resume"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-control text-[16px] font-medium text-ink hover:bg-mist transition-colors min-h-[44px]"
          >
            <FileText className="w-5 h-5 text-moss" />
            <span>Digital resume</span>
          </Link>

          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-control text-[16px] font-medium text-ink hover:bg-mist transition-colors min-h-[44px]"
          >
            <User className="w-5 h-5 text-moss" />
            <span>Profile</span>
          </Link>

          <Link
            to="/help"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-control text-[16px] font-medium text-ink hover:bg-mist transition-colors min-h-[44px]"
          >
            <HelpCircle className="w-5 h-5 text-moss" />
            <span>Help</span>
          </Link>

          <Link
            to="/account"
            onClick={onClose}
            className="flex items-center gap-3 p-3 rounded-control text-[16px] font-medium text-ink hover:bg-mist transition-colors min-h-[44px]"
          >
            <Shield className="w-5 h-5 text-moss" />
            <span>Account & security</span>
          </Link>

          <div className="pt-2 border-t border-hairline">
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-control text-[16px] font-medium text-danger-600 hover:bg-danger-50 transition-colors min-h-[44px]"
            >
              <LogOut className="w-5 h-5 text-danger-600" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
