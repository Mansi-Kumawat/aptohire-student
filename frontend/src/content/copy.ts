export const copy = {
  brand: {
    name: 'AptoHire',
    portalName: 'student',
    tagline: 'Hired for what you can do.',
  },
  auth: {
    loginTitle: 'Sign in to AptoHire',
    loginSubtitle: 'Enter your student account credentials',
    signupTitle: 'Create your student account',
    signupSubtitle: 'Start building real projects to prove your skills',
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordSubtitle: 'We will send you a link to reset your password',
    resetPasswordTitle: 'Set a new password',
    demoAccountsTitle: 'Demo accounts',
    sessionExpired: 'Your session ended. Sign in again to continue.',
  },
  review: {
    submittedHeadline: 'Project submitted. We\'re reviewing it now.',
    submittedSubtext: 'You can leave this page. We\'ll notify you when your score is ready.',
    stages: {
      received: 'Received',
      reading: 'Reading your code and files',
      watching: 'Watching your demo video',
      scoring: 'Scoring against the rubric',
      writing: 'Writing your feedback',
      done: 'Ready',
    },
    failedTitle: 'We couldn\'t finish the review. Retry now, or contact support if it happens again.',
    pausedTitle: 'Reviews are paused. Your project is saved. Try again later.',
    borderlineNotice: 'Under human review. A reviewer will confirm your result within 3 working days.',
    borderlineSharingNote: 'Results under human review aren\'t shared with organizations until confirmed.',
  },
  errors: {
    VIDEO_REQUIRED: 'Add your demo video or a video link before submitting.',
    MISSING_SKILLS: 'Choose at least one skill this project shows.',
    QUOTA_EXCEEDED: 'You\'ve reached today\'s limit for reviews. Try again tomorrow.',
    KILL_SWITCH: 'Reviews are paused. Your project is saved. Try again later.',
    NO_TEMPLATE: 'Projects for this skill aren\'t available yet. You can upload a project you\'ve already built.',
    RATE_LIMITED: 'Too many attempts. Try again in a few minutes.',
    NETWORK_ERROR: 'We couldn\'t reach AptoHire. Check your connection and try again.',
    VALIDATION_FAILED: 'Please check the highlighted fields.',
    GENERIC: 'Something went wrong. Please try again.',
  },
  university: {
    unverifiedNotice: 'Your university isn\'t on AptoHire yet. Your scores and job matches are not affected.',
    rosterMatched: (uniName: string) => `We matched you to ${uniName}. Your university is verified.`,
    rosterNoMatch: 'We couldn\'t find you on this university\'s list.',
    managedByUniversity: 'Managed by your university.',
    confirmNewProposal: (uniName: string) => `${uniName} added you to its list. Confirm your new university.`,
  },
  sharing: {
    withdrawToast: 'Access withdrawn.',
    declineToast: 'Request declined.',
    noRequests: 'No requests yet. When an organization asks to see your profile, it will appear here.',
    noActive: 'No active access. When you accept a request it will appear here.',
    noFeedback: 'No feedback yet.',
  },
  prototypeNotice: 'Prototype. All people, universities and organizations shown are fictional.',
  offlineNotice: 'You\'re offline. Changes will save when you reconnect.',
};

export function mapErrorCodeToCopy(code?: string): string {
  if (!code) return copy.errors.GENERIC;
  return (copy.errors as Record<string, string>)[code] || copy.errors.NETWORK_ERROR;
}
