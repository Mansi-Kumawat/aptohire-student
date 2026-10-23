import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '@/lib/backend';

export function useBootstrap() {
  const backend = useBackend();
  const navigate = useNavigate();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBootstrap = async () => {
    setIsBootstrapping(true);
    setError(null);

    try {
      const user = await backend.auth.getCurrentUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      // (a) Ensure role is set to student
      await backend.auth.completeSignup();

      // (b) Check if student profile or affiliation exists
      const affiliations = await backend.affiliations.listAffiliations(user.id);
      if (affiliations.length === 0) {
        navigate('/onboarding', { replace: true });
        return;
      }

      // (c) Done -> navigate to Home
      navigate('/', { replace: true });
    } catch (err: unknown) {
      console.error('Bootstrap error:', err);
      setError('Failed to initialize account session.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  return { runBootstrap, isBootstrapping, error };
}
