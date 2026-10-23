import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { BackendProvider } from '@/lib/backend';
import { ToastProvider } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      <Helmet defaultTitle="AptoHire Student Portal">
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <BackendProvider>
          <ToastProvider>{children}</ToastProvider>
        </BackendProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};
