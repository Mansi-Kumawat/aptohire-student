import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';

export function useProjects() {
  const backend = useBackend();
  const { user } = useAuth();
  const studentId = user?.id || '';
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', studentId],
    queryFn: () => backend.projects.listAssignments(studentId),
    enabled: !!studentId,
  });

  const submissionsQuery = useQuery({
    queryKey: ['submissions', studentId],
    queryFn: () => backend.submissions.listSubmissions(studentId),
    enabled: !!studentId,
  });

  const assignProjectMutation = useMutation({
    mutationFn: (params: {
      target: { skill_slug?: string; role_text?: string };
      level?: 'Competent' | 'Proficient' | 'Advanced';
    }) =>
      backend.projects.assignProject({
        student_id: studentId,
        target: params.target,
        level: params.level,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', studentId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      assignmentId,
      status,
    }: {
      assignmentId: string;
      status: 'in_progress';
    }) => backend.projects.updateAssignmentStatus(assignmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', studentId] });
    },
  });

  return {
    assignments: assignmentsQuery.data || [],
    submissions: submissionsQuery.data || [],
    isLoading: assignmentsQuery.isLoading || submissionsQuery.isLoading,
    assignProject: assignProjectMutation.mutateAsync,
    isAssigning: assignProjectMutation.isPending,
    updateAssignmentStatus: updateStatusMutation.mutateAsync,
  };
}

export function useProjectBrief(assignmentId: string) {
  const backend = useBackend();
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => backend.projects.getAssignment(assignmentId),
    enabled: !!assignmentId,
  });
}
