import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { RoleGuard } from './RoleGuard';
import { Skeleton } from '@/components/ui/Skeleton';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <RoleGuard user={user}>{children}</RoleGuard>;
};
