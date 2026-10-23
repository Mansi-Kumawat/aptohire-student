import React from 'react';
import { env } from '@/config/env';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

interface DemoAccountsPanelProps {
  onSelectAccount: (email: string) => void;
  isLoading?: boolean;
}

export const DemoAccountsPanel: React.FC<DemoAccountsPanelProps> = ({
  onSelectAccount,
  isLoading,
}) => {
  // Excluded from production builds
  if (env.VITE_APP_ENV === 'production' || !env.VITE_DEMO_MODE) {
    return null;
  }

  const demoAccounts = [
    {
      name: 'Aarav Sharma',
      email: 'aarav@unia.edu.test',
      badge: 'Verified (Roster)',
      desc: 'React 72 Proficient, pending access requests',
    },
    {
      name: 'Naman Patel',
      email: 'naman@demo.aptohire.test',
      badge: 'First-time user',
      desc: 'Uni B, brand new with zero projects',
    },
    {
      name: 'Avi Verma',
      email: 'avi@demo.aptohire.test',
      badge: 'Alumni + Proposal',
      desc: 'SQL 88 Advanced, pending Uni B proposal',
    },
    {
      name: 'Niya Sen',
      email: 'niya@demo.aptohire.test',
      badge: 'Unregistered Uni',
      desc: 'Uni D (unregistered), scores unaffected',
    },
  ];

  const roleGuardAccounts = [
    { name: 'University Staff', email: 'uni-staff@unia.edu.test', role: 'university' },
    { name: 'Org Recruiter', email: 'recruiter@northwind.test', role: 'organization' },
    { name: 'Admin Account', email: 'admin@aptohire.test', role: 'admin' },
  ];

  return (
    <div className="mt-8 border border-ember-300 bg-ember-50/40 rounded-panel p-5 select-none">
      <div className="flex items-center gap-2 mb-3 text-ember-700">
        <Sparkles className="w-4 h-4 shrink-0" />
        <h3 className="font-display font-semibold text-sm">Demo accounts</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-ember-100 font-mono">
          One-click sign-in
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectAccount(account.email)}
            className="w-full text-left p-3 rounded-control bg-canvas border border-hairline hover:border-ember-300 hover:bg-ember-50/50 transition-colors flex items-center justify-between group disabled:opacity-50"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink group-hover:text-ember-700 transition-colors">
                  {account.name}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-mist text-moss border border-hairline">
                  {account.badge}
                </span>
              </div>
              <p className="text-xs text-moss mt-0.5">{account.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-moss group-hover:text-ember-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-hairline">
        <p className="text-[11px] text-moss mb-2 font-medium">Test RoleGuard routing:</p>
        <div className="flex flex-wrap gap-2">
          {roleGuardAccounts.map((rg) => (
            <Button
              key={rg.email}
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => onSelectAccount(rg.email)}
              className="text-xs h-[30px] px-2.5"
            >
              {rg.name} ({rg.role})
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
