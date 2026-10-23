import React, { useState } from 'react';
import { env } from '@/config/env';
import { copy } from '@/content/copy';
import { X, Info } from 'lucide-react';

export const PrototypeNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aptohire_prototype_notice_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (env.VITE_APP_ENV === 'production' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('aptohire_prototype_notice_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="region"
      aria-label="Prototype notice"
      className="w-full bg-mist border-b border-hairline py-1.5 px-4 text-xs text-moss flex items-center justify-between z-40"
    >
      <div className="flex items-center gap-2 mx-auto">
        <Info className="w-3.5 h-3.5 text-ember-700 shrink-0" />
        <span>{copy.prototypeNotice}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded text-moss hover:text-ink transition-colors"
        aria-label="Dismiss prototype notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
