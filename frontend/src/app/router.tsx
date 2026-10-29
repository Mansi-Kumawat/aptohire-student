import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AuthGate } from './AuthGate';
import { ErrorBoundary } from './ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoginPage } from '@/pages/LoginPage';
import { useAuth } from '@/features/auth/useAuth';
import { AppShell } from '@/components/shell/AppShell';
import { useBackend } from '@/lib/backend';
import { NotificationItem } from '@/lib/domain/types';

// Route-level lazy loading
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectAssistantPage = lazy(() => import('@/pages/ProjectAssistantPage'));
const ProjectBriefPage = lazy(() => import('@/pages/ProjectBriefPage'));
const SubmissionPage = lazy(() => import('@/pages/SubmissionPage'));
const ReviewProgressPage = lazy(() => import('@/pages/ReviewProgressPage'));
const ScorecardPage = lazy(() => import('@/pages/ScorecardPage'));
const SkillDetailPage = lazy(() => import('@/pages/SkillDetailPage'));
const SharingPage = lazy(() => import('@/pages/SharingPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ResumePage = lazy(() => import('@/pages/ResumePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const PublicVerifyPage = lazy(() => import('@/pages/PublicVerifyPage'));

const PageFallback = () => (
  <div className="max-w-4xl mx-auto space-y-4 py-8 px-4">
    <Skeleton className="h-8 w-60" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

// Shell wrapper that supplies notifications, avatar, and counts to AppShell
const AuthenticatedShellWrapper: React.FC = () => {
  const { user, signOut } = useAuth();
  const backend = useBackend();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (!user) return;

    backend.notifications.listNotifications(user.id)
      .then(setNotifications)
      .catch(() => setNotifications([]));
    backend.student.getProfile(user.id)
      .then((profile) => setAvatarUrl(profile.avatar_url || null))
      .catch(() => setAvatarUrl(null));
    backend.sharing.listAccessRequests(user.id)
      .then((requests) => {
        const pending = requests.filter((request) => request.status === 'pending').length;
        setPendingRequestsCount(pending);
      })
      .catch(() => setPendingRequestsCount(0));

    const unsubNotifs = backend.notifications.subscribeNotifications(
      user.id,
      (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      }
    );

    return () => {
      unsubNotifs();
    };
  }, [backend, user]);

  const handleMarkRead = async (id: string) => {
    await backend.notifications.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await backend.notifications.markAllNotificationsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <AppShell
      user={user}
      avatarUrl={avatarUrl}
      notifications={notifications}
      pendingRequestsCount={pendingRequestsCount}
      onMarkNotificationRead={handleMarkRead}
      onMarkAllNotificationsRead={handleMarkAllRead}
      onSignOut={handleSignOut}
    />
  );
};

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary><LoginPage /></ErrorBoundary>,
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<PageFallback />}>
        <SignupPage />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AuthCallbackPage />
      </Suspense>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <Suspense fallback={<PageFallback />}>
        <OnboardingPage />
      </Suspense>
    ),
  },
  {
    path: '/verify/:credentialId',
    element: (
      <Suspense fallback={<PageFallback />}>
        <PublicVerifyPage />
      </Suspense>
    ),
  },

  // Authenticated App Shell routes
  {
    path: '/',
    element: (
      <AuthGate>
        <AuthenticatedShellWrapper />
      </AuthGate>
    ),
    errorElement: <ErrorBoundary><div className="p-8 text-center"><p>Error loading page.</p></div></ErrorBoundary>,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/new',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProjectAssistantPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/:assignmentId',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProjectBriefPage />
          </Suspense>
        ),
      },
      {
        path: 'submissions/new',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SubmissionPage />
          </Suspense>
        ),
      },
      {
        path: 'submissions/:id/edit',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SubmissionPage />
          </Suspense>
        ),
      },
      {
        path: 'submissions/:id',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReviewProgressPage />
          </Suspense>
        ),
      },
      {
        path: 'scorecard',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ScorecardPage />
          </Suspense>
        ),
      },
      {
        path: 'scorecard/:skillSlug',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SkillDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'sharing',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SharingPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'resume',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ResumePage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'account',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AccountPage />
          </Suspense>
        ),
      },
      {
        path: 'help',
        element: (
          <Suspense fallback={<PageFallback />}>
            <HelpPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
