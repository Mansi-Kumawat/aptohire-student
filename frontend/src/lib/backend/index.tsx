import React, { createContext, useContext, useMemo } from 'react';
import { env } from '@/config/env';
import { MockBackend } from './mock';
import { SupabaseBackend } from './supabase';
import { Backend } from './types';

export * from './types';

let singletonBackend: Backend | null = null;

export function getBackend(): Backend {
  if (singletonBackend) return singletonBackend;

  if (env.VITE_USE_MOCKS) {
    singletonBackend = new MockBackend();
  } else {
    singletonBackend = new SupabaseBackend();
  }

  return singletonBackend;
}

const BackendContext = createContext<Backend | null>(null);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const backend = useMemo(() => getBackend(), []);
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
};

export function useBackend(): Backend {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
}
