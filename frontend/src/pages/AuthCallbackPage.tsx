import React, { useEffect } from 'react';
import { useBootstrap } from '@/features/auth/useBootstrap';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const AuthCallbackPage: React.FC = () => {
  const { runBootstrap, error } = useBootstrap();

  useEffect(() => {
    runBootstrap();
  }, [runBootstrap]);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <Helmet>
          <title>Session Error · AptoHire</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <h2 className="text-xl font-bold font-display text-ink mb-2">
          Unable to verify session
        </h2>
        <p className="text-moss text-sm mb-6 max-w-sm">{error}</p>
        <Link to="/login">
          <Button variant="primary">Return to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>Authenticating… · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-md space-y-4 text-center">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-60 mx-auto" />
        <p className="text-xs text-moss mt-4">Connecting your student account…</p>
      </div>
    </div>
  );
};
export default AuthCallbackPage;
