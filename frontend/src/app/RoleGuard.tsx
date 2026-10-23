import React from 'react';
import { AuthUser } from '@/lib/backend/types';
import { portalUrl } from '@/config/links';
import { Button } from '@/components/ui/Button';
import { ExternalLink, ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  user: AuthUser | null;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ user, children }) => {
  if (!user) {
    return null;
  }

  // 1. Student role passes cleanly
  if (user.role === 'student') {
    return <>{children}</>;
  }

  // 2. University or Organization role: show "Go to your portal" screen
  if (user.role === 'university' || user.role === 'organization') {
    const targetUrl = portalUrl(user.role);
    const portalName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-verdant-100 flex items-center justify-center text-verdant-800 mb-6 border border-verdant-300">
          <ExternalLink className="w-8 h-8" />
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
          Go to your portal
        </h1>
        <p className="text-moss text-[16px] max-w-md mb-8 leading-relaxed">
          This account is registered for the {portalName} portal. You can access your dashboard
          at {user.role}.aptohire.com.
        </p>

        <a href={targetUrl} rel="noopener noreferrer">
          <Button variant="primary" size="lg">
            <span>Open {portalName} portal</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>
    );
  }

  // 3. Any other role (including admin or unrecognized):
  // Rule: Generic screen "This account can't use the student site." with NO LINK and NO ROLE NAMED.
  // Never link to or mention the admin portal!
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center text-moss mb-6 border border-hairline">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
        This account can't use the student site.
      </h1>
      <p className="text-moss text-[16px] max-w-md mb-8 leading-relaxed">
        Your account role does not have access to this portal.
      </p>
    </div>
  );
};
