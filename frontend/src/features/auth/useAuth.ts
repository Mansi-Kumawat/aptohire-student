import { useState, useEffect, useCallback } from 'react';
import { useBackend, AuthUser } from '@/lib/backend';
import { LoginInput, SignupInput } from '@/lib/schemas';
import { useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const backend = useBackend();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await backend.auth.getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    refreshUser();

    const unsubscribe = backend.auth.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      setIsLoading(false);
      queryClient.invalidateQueries();
    });

    return () => {
      unsubscribe();
    };
  }, [backend, refreshUser, queryClient]);

  const signIn = async (input: LoginInput) => {
    const res = await backend.auth.signIn(input);
    setUser(res);
    queryClient.invalidateQueries();
    return res;
  };

  const signUp = async (input: SignupInput) => {
    const res = await backend.auth.signUp(input);
    if (!res.requiresEmailVerification) {
      setUser(res.user);
      queryClient.invalidateQueries();
    }
    return res;
  };

  const signOut = async (scope?: 'local' | 'global') => {
    await backend.auth.signOut({ scope });
    setUser(null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };
}
