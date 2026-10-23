import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { RespondAccessInput } from '@/lib/schemas';

export function useSharing() {
  const backend = useBackend();
  const { user } = useAuth();
  const studentId = user?.id || '';
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['access_requests', studentId],
    queryFn: () => backend.sharing.listAccessRequests(studentId),
    enabled: !!studentId,
  });

  const feedbackQuery = useQuery({
    queryKey: ['feedback', studentId],
    queryFn: () => backend.sharing.listFeedback(studentId),
    enabled: !!studentId,
  });

  const respondMutation = useMutation({
    mutationFn: (input: RespondAccessInput) => backend.sharing.respondAccess(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_requests', studentId] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (requestId: string) => backend.sharing.withdrawAccess(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_requests', studentId] });
    },
  });

  return {
    requests: requestsQuery.data || [],
    feedback: feedbackQuery.data || [],
    isLoading: requestsQuery.isLoading || feedbackQuery.isLoading,
    respondAccess: respondMutation.mutateAsync,
    withdrawAccess: withdrawMutation.mutateAsync,
  };
}
