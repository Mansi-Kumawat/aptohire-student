import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import {
  StudentProfile,
  SkillScore,
  AccessRequest,
  ProjectAssignment,
  Submission,
  AffiliationProposal,
  Affiliation,
  PublicConfig,
} from '@/lib/domain/types';
import { ProofRing } from '@/components/proof/ProofRing';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RichSelect } from '@/components/ui/RichSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Helmet } from 'react-helmet-async';
import QRCode from 'qrcode';
import {
  Sparkles,
  ArrowRight,
  Share2,
  Building2,
  Plus,
  Search,
  LayoutGrid,
  List,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Award,
  QrCode,
  TrendingUp,
  FolderGit2,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { copy } from '@/content/copy';

export const HomePage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [skills, setSkills] = useState<SkillScore[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [proposals, setProposals] = useState<AffiliationProposal[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dataWarning, setDataWarning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Interactive dashboard state
  const [skillFilter, setSkillFilter] = useState<'all' | 'verified' | 'review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Interactive Popups / Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Quick Review & Grant Modal state
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [grantDuration, setGrantDuration] = useState<7 | 30 | 90>(30);
  const [isGranting, setIsGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      setDataWarning(false);
      if (!user) {
        setLoadError(true);
        setIsLoading(false);
        return;
      }
      try {
        // Load the essential profile first so one optional endpoint cannot blank the page.
        const prof = await backend.student.getProfile(user.id);
        if (cancelled) return;
        setProfile(prof);

        const results = await Promise.allSettled([
          backend.affiliations.listAffiliations(user.id),
          backend.scores.listSkillScores(user.id),
          backend.sharing.listAccessRequests(user.id),
          backend.projects.listAssignments(user.id),
          backend.submissions.listSubmissions(user.id),
          backend.affiliations.listProposals(user.id),
          backend.config.getPublicConfig(),
        ]);
        if (cancelled) return;
        const [affs, scs, reqs, asgs, subs, props, cfg] = results;
        setAffiliations(affs.status === 'fulfilled' ? affs.value : []);
        setSkills(scs.status === 'fulfilled' ? scs.value : []);
        setRequests(reqs.status === 'fulfilled' ? reqs.value : []);
        setAssignments(asgs.status === 'fulfilled' ? asgs.value : []);
        setSubmissions(subs.status === 'fulfilled' ? subs.value : []);
        setProposals(props.status === 'fulfilled' ? props.value : []);
        setConfig(cfg.status === 'fulfilled' ? cfg.value : null);
        setDataWarning(results.some((result) => result.status === 'rejected'));
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [backend, user, retryCount]);

  // Generate QR Code for sharing modal
  useEffect(() => {
    if (isShareModalOpen && profile) {
      const verifyUrl = `${window.location.origin}/verify/${profile.credential_id || 'credential-88219'}`;
      QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [isShareModalOpen, profile]);



  if (isLoading) {
    return (
      <div className="space-y-6 antialiased pb-12 animate-pulse">
        <Skeleton className="h-32 w-full rounded-panel" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
          <Skeleton className="h-28 rounded-panel" />
        </div>
        <Skeleton className="h-64 w-full rounded-panel" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <section className="max-w-3xl mx-auto rounded-panel border border-hairline bg-canvas p-6 sm:p-8 shadow-sm">
        <h1 className="font-display font-bold text-xl text-ink">Your student profile could not be loaded</h1>
        <p className="mt-2 text-sm text-moss">If you just created your account, finish onboarding first. Otherwise check your connection and retry.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setRetryCount((count) => count + 1)}>Retry</Button>
          <Link to="/onboarding"><Button variant="secondary">Continue onboarding</Button></Link>
        </div>
      </section>
    );
  }

  const firstName = profile.full_name.split(' ')[0] || 'Student';

  // Compute "What to do next" by priority order
  const pendingProposal = proposals[0];
  const activeSubmission = submissions.find(
    (s) => s.status === 'auditing' || s.status === 'submitted'
  );
  const justReadySubmission = submissions.find((s) => s.status === 'scored');
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const activeDraft = submissions.find((s) => s.status === 'draft');
  const assignedProject = assignments.find((a) => a.status === 'assigned');

  // Stats calculation
  const verifiedSkillsCount = skills.filter((s) => s.is_verified).length;
  const projectsReviewedCount = submissions.filter(
    (s) => s.status === 'scored' || s.status === 'needs_review'
  ).length;
  const activeSharingCount = requests.filter((r) => r.status === 'accepted').length;

  // Average verified score
  const verifiedScores = skills.filter((s) => s.is_verified && s.score !== null);
  const averageScore =
    verifiedScores.length > 0
      ? Math.round(verifiedScores.reduce((sum, s) => sum + (s.score || 0), 0) / verifiedScores.length)
      : 88;

  const suggestedSkill = skills.length > 0 ? skills[0].skill_name : 'React';

  // Filtered skills list
  const filteredSkills = skills.filter((skill) => {
    const matchesFilter =
      skillFilter === 'all'
        ? true
        : skillFilter === 'verified'
        ? skill.is_verified
        : !skill.is_verified || skill.is_borderline;
    const matchesSearch =
      skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.family.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle Quick Grant in Modal
  const handleQuickGrant = async () => {
    if (!selectedRequest || !user) return;
    setIsGranting(true);
    try {
      await backend.sharing.respondAccess({
        decision: 'accept',
        request_id: selectedRequest.id,
        duration_days: grantDuration,
        granted_scope: selectedRequest.requested_scopes,
      });
      setGrantSuccess(true);
      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: 'accepted' } : r))
      );
      setTimeout(() => {
        setGrantSuccess(false);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGranting(false);
    }
  };

  const handleCopyShareLink = () => {
    const verifyUrl = `${window.location.origin}/verify/${profile.credential_id || 'credential-88219'}`;
    navigator.clipboard.writeText(verifyUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentAffiliation = affiliations.find((a) => a.is_current) || affiliations[0];

  return (
    <div className="space-y-8 antialiased pb-16 animate-in fade-in duration-300">
      <Helmet>
        <title>Home · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {dataWarning && (
        <div role="status" className="rounded-control border border-hairline bg-mist px-4 py-3 text-sm text-moss">
          Your profile loaded, but some dashboard information is temporarily unavailable.
        </div>
      )}

      {/* WELCOME BACK SECTION: MODERN CARD VERSION WITH TOP-TIER UI/UX */}
      <div
        className="relative overflow-hidden rounded-2xl border border-hairline/90 p-6 sm:p-8 shadow-sm transition-all"
        style={{
          background:
            'linear-gradient(135deg, rgba(232, 249, 239, 0.75) 0%, rgba(255, 255, 255, 0.95) 45%, rgba(255, 241, 224, 0.55) 100%)',
        }}
      >
        {/* Subtle decorative glow accents inside the card */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            {/* Status indicators */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-300/70 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Verified via Roster
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-moss border border-hairline shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-verdant-700" />
                {currentAffiliation?.university_name || 'Uni A (Apex Institute of Technology)'}
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-[34px] text-ink tracking-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="text-moss text-sm sm:text-base leading-relaxed font-normal">
              Here is your current skill status and opportunities
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white text-ink text-sm font-semibold border border-hairline/90 hover:border-verdant-400 hover:bg-mist/30 hover:shadow-subtle active:scale-[0.98] transition-all"
            >
              <Share2 className="w-4 h-4 text-verdant-700" />
              <span>Share Proof Link</span>
            </button>

            <Link to="/projects/new">
              <Button variant="accent" size="default" className="shadow-sm active:scale-[0.98] h-11 rounded-xl font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Get a project</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* INTERACTIVE 4-METRIC STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Verified Skills */}
        <button
          type="button"
          onClick={() => setSkillFilter(skillFilter === 'verified' ? 'all' : 'verified')}
          className={`text-left p-4 sm:p-5 rounded-panel border transition-all duration-200 group relative overflow-hidden ${
            skillFilter === 'verified'
              ? 'border-verdant-600 bg-verdant-50/50 shadow-sm ring-1 ring-verdant-600'
              : 'border-hairline bg-canvas hover:border-verdant-300 hover:shadow-card-hover hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-moss uppercase tracking-wider">
              Verified Skills
            </span>
            <Award className="w-4 h-4 text-verdant-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink tabular-nums">
              {verifiedSkillsCount}
            </span>
            <span className="text-xs font-medium text-verdant-700 bg-verdant-100/70 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <p className="text-[11px] text-moss mt-1.5 flex items-center justify-between">
            <span>Pass mark: {config?.pass_mark || 70}+</span>
            <span className="text-verdant-700 font-semibold group-hover:underline">
              {skillFilter === 'verified' ? 'Show all' : 'Filter list'}
            </span>
          </p>
        </button>

        {/* Metric 2: Average Proof Score */}
        <Link
          to="/scorecard"
          className="text-left p-4 sm:p-5 rounded-panel border border-hairline bg-canvas hover:border-verdant-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-moss uppercase tracking-wider">
              Proof Index
            </span>
            <TrendingUp className="w-4 h-4 text-verdant-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink tabular-nums">
              {averageScore}
            </span>
            <span className="text-xs font-semibold text-verdant-800 bg-verdant-50 px-1.5 py-0.5 rounded border border-verdant-200">
              Proficient
            </span>
          </div>
          <p className="text-[11px] text-moss mt-1.5 flex items-center justify-between">
            <span>Industry ready</span>
            <span className="text-verdant-700 font-semibold group-hover:underline">Scorecard &rarr;</span>
          </p>
        </Link>

        {/* Metric 3: Projects Evaluated */}
        <Link
          to="/projects"
          className="text-left p-4 sm:p-5 rounded-panel border border-hairline bg-canvas hover:border-verdant-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-moss uppercase tracking-wider">
              Projects
            </span>
            <FolderGit2 className="w-4 h-4 text-moss group-hover:text-ink transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink tabular-nums">
              {projectsReviewedCount}
            </span>
            {activeSubmission && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                1 Auditing
              </span>
            )}
          </div>
          <p className="text-[11px] text-moss mt-1.5 flex items-center justify-between">
            <span>{submissions.length} total briefs</span>
            <span className="text-verdant-700 font-semibold group-hover:underline">View briefs &rarr;</span>
          </p>
        </Link>

        {/* Metric 4: Employer Visibility */}
        <Link
          to="/sharing"
          className="text-left p-4 sm:p-5 rounded-panel border border-hairline bg-canvas hover:border-verdant-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-moss uppercase tracking-wider">
              Employer Access
            </span>
            <Lock className="w-4 h-4 text-moss group-hover:text-ink transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl sm:text-3xl text-ink tabular-nums">
              {activeSharingCount}
            </span>
            {pendingRequests.length > 0 && (
              <span className="text-xs font-bold text-ember-700 bg-ember-100 px-1.5 py-0.5 rounded animate-pulse">
                {pendingRequests.length} Waiting
              </span>
            )}
          </div>
          <p className="text-[11px] text-moss mt-1.5 flex items-center justify-between">
            <span>Blind by default</span>
            <span className="text-verdant-700 font-semibold group-hover:underline">Manage &rarr;</span>
          </p>
        </Link>
      </div>

      {/* ACTION STATION: WHAT TO DO NEXT (Interactive Banner) */}
      <div className="relative overflow-hidden rounded-panel border border-verdant-300/70 bg-gradient-to-r from-verdant-50/60 via-canvas to-canvas p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-verdant-800 mb-3">
          <span className="w-2 h-2 rounded-full bg-verdant-600 animate-ping" />
          <Sparkles className="w-3.5 h-3.5 text-verdant-700" />
          <span>What to do next</span>
        </div>

        {/* Priority 1: Pending affiliation proposal */}
        {pendingProposal ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                {copy.university.confirmNewProposal(pendingProposal.university_name)}
              </h3>
              <p className="text-xs sm:text-sm text-moss">
                Confirm your new masters or alumni affiliation. Your verified skill scores remain intact.
              </p>
            </div>
            <Link to="/profile?tab=education" className="shrink-0">
              <Button variant="primary" size="default">
                Confirm affiliation &rarr;
              </Button>
            </Link>
          </div>
        ) : activeSubmission ? (
          /* Priority 2: Review in progress */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                  Audit in progress: {activeSubmission.title}
                </h3>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs sm:text-sm text-moss">
                AI rubric scoring and evidence verification running. Typically takes ~15 seconds.
              </p>
            </div>
            <Link to={`/submissions/${activeSubmission.id}`} className="shrink-0">
              <Button variant="primary" size="default">
                <span>View review progress</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : justReadySubmission ? (
          /* Priority 3: Score just ready */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                  Your score is ready for {justReadySubmission.title}!
                </h3>
                <span className="text-[11px] font-semibold text-verdant-800 bg-verdant-100 px-2 py-0.5 rounded-full">
                  New Score
                </span>
              </div>
              <p className="text-xs sm:text-sm text-moss">
                Review your rubric scores, Proof Ring, and cryptographic verification evidence.
              </p>
            </div>
            <Link to={`/submissions/${justReadySubmission.id}`} className="shrink-0">
              <Button variant="primary" size="default">
                <span>View scorecard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : pendingRequests.length > 0 ? (
          /* Priority 4: Pending access requests with Quick Review Modal trigger */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                  {pendingRequests.length} access {pendingRequests.length === 1 ? 'request' : 'requests'} waiting for your decision
                </h3>
                <span className="text-[11px] font-bold text-ember-700 bg-ember-100 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-xs sm:text-sm text-moss">
                <strong>{pendingRequests[0].organization_name}</strong> wants to inspect your verified skills.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="default"
                onClick={() => setSelectedRequest(pendingRequests[0])}
              >
                <span>Quick Review</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/sharing">
                <Button variant="secondary" size="default">
                  All Requests
                </Button>
              </Link>
            </div>
          </div>
        ) : activeDraft ? (
          /* Priority 5: Draft in progress */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                Continue project draft: {activeDraft.title}
              </h3>
              <p className="text-xs sm:text-sm text-moss">
                Your code and deliverables are saved. Upload your demo video to submit for assessment.
              </p>
            </div>
            <Link to={`/submissions/${activeDraft.id}/edit`} className="shrink-0">
              <Button variant="primary" size="default">
                <span>Resume draft</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : assignedProject ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                Start brief: {assignedProject.brief.title}
              </h3>
              <p className="text-xs sm:text-sm text-moss">
                Review deliverables and rubric preview for {assignedProject.target_skill}.
              </p>
            </div>
            <Link to={`/projects/${assignedProject.id}`} className="shrink-0">
              <Button variant="primary" size="default">
                <span>Open brief</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          /* Priority 6: No projects -> Accent button Get a project */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-base sm:text-lg text-ink">
                Prove what you can do
              </h3>
              <p className="text-xs sm:text-sm text-moss">
                Select a target skill to get your first tailored project brief with industry rubrics.
              </p>
            </div>
            <Link to="/projects/new" className="shrink-0">
              <Button variant="accent" size="default">
                <span>Get a project</span>
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* INTERACTIVE SKILLS EXPLORER */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-lg sm:text-xl text-ink">
              Your Skills & Credentials
            </h2>
            <p className="text-xs text-moss">
              Interactive scorecards backed by verified project rubrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-control border border-hairline bg-canvas p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-mist text-ink shadow-sm'
                    : 'text-moss hover:text-ink'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-mist text-ink shadow-sm'
                    : 'text-moss hover:text-ink'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/scorecard"
              className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1 pl-2"
            >
              <span>Full Scorecard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSkillFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                skillFilter === 'all'
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-canvas border border-hairline text-moss hover:text-ink hover:bg-mist'
              }`}
            >
              All ({skills.length})
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter('verified')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                skillFilter === 'verified'
                  ? 'bg-verdant-700 text-white shadow-sm'
                  : 'bg-canvas border border-hairline text-moss hover:text-ink hover:bg-mist'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verified ({verifiedSkillsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter('review')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                skillFilter === 'review'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-canvas border border-hairline text-moss hover:text-ink hover:bg-mist'
              }`}
            >
              Needs Assessment ({skills.length - verifiedSkillsCount})
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-moss" />
            <input
              type="text"
              placeholder="Filter skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-control bg-canvas text-ink text-xs border border-hairline focus:border-verdant-700 focus:outline-none focus:ring-1 focus:ring-verdant-700"
            />
          </div>
        </div>

        {/* Skills Display */}
        {filteredSkills.length === 0 ? (
          <div className="p-8 border border-hairline rounded-panel bg-canvas text-center space-y-3">
            <p className="text-sm text-moss">No skills match your filter.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSkillFilter('all');
                setSearchQuery('');
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => {
              const state = skill.is_borderline
                ? 'under-review'
                : skill.is_verified
                ? 'verified'
                : 'not-verified';

              return (
                <div
                  key={skill.id}
                  className="p-5 rounded-panel border border-hairline bg-canvas hover:border-verdant-300 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <ProofRing
                          score={skill.score}
                          skill={skill.skill_name}
                          state={state}
                          size={56}
                          animate={false}
                          showCaption={false}
                          passMark={config?.pass_mark}
                        />
                        <div>
                          <h3 className="font-display font-semibold text-base text-ink group-hover:text-verdant-700 transition-colors">
                            {skill.skill_name}
                          </h3>
                          <span className="text-[11px] font-medium text-moss">{skill.family}</span>
                        </div>
                      </div>

                      <StatusChip
                        kind={
                          skill.is_verified
                            ? (skill.level.toLowerCase() as
                                | 'emerging'
                                | 'competent'
                                | 'proficient'
                                | 'advanced')
                            : 'under-review'
                        }
                        label={skill.level}
                      />
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex items-center justify-between text-[11px] font-medium text-moss">
                        <span>Proof Score</span>
                        <span className="text-ink font-semibold">{skill.score || 0} / 100</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-mist overflow-hidden">
                        <div
                          className="h-full rounded-full bg-verdant-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, skill.score || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-hairline flex items-center justify-between">
                    <Link
                      to={`/verify/${profile.credential_id || 'credential-88219'}?skill=${skill.skill_slug}`}
                      className="text-xs font-semibold text-moss hover:text-ink flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </Link>

                    <Link
                      to={`/scorecard/${skill.skill_slug}`}
                      className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1"
                    >
                      <span>View scorecard</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT LIST VIEW */
          <div className="divide-y divide-hairline border border-hairline rounded-panel bg-canvas overflow-hidden">
            {filteredSkills.map((skill) => {
              const state = skill.is_borderline
                ? 'under-review'
                : skill.is_verified
                ? 'verified'
                : 'not-verified';

              return (
                <Link
                  key={skill.id}
                  to={`/scorecard/${skill.skill_slug}`}
                  className="p-4 flex items-center justify-between hover:bg-mist/60 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <ProofRing
                      score={skill.score}
                      skill={skill.skill_name}
                      state={state}
                      size={56}
                      animate={false}
                      showCaption={false}
                      passMark={config?.pass_mark}
                    />

                    <div>
                      <h3 className="font-semibold text-sm text-ink group-hover:text-verdant-700 transition-colors">
                        {skill.skill_name}
                      </h3>
                      <p className="text-xs text-moss">{skill.family}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-sm font-bold text-ink tabular-nums block">
                        {skill.score || 0} / 100
                      </span>
                      <span className="text-[11px] text-moss">Score</span>
                    </div>

                    <StatusChip
                      kind={
                        skill.is_verified
                          ? (skill.level.toLowerCase() as
                              | 'emerging'
                              | 'competent'
                              | 'proficient'
                              | 'advanced')
                          : 'under-review'
                      }
                      label={skill.level}
                    />
                    <ArrowRight className="w-4 h-4 text-moss group-hover:text-verdant-700 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* PENDING EMPLOYER ACCESS REQUESTS SECTION */}
      {pendingRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <Share2 className="w-5 h-5 text-moss" />
              <span>Pending Employer Access Requests</span>
            </h2>
            <Link
              to="/sharing"
              className="text-xs font-semibold text-verdant-700 hover:text-verdant-800"
            >
              View in Sharing
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.slice(0, 2).map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-panel border border-hairline bg-canvas space-y-3 shadow-subtle hover:border-verdant-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-verdant-700" />
                    <span className="font-semibold text-sm text-ink">{req.organization_name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-ember-700 bg-ember-100 px-2 py-0.5 rounded-full">
                    Awaiting your decision
                  </span>
                </div>

                <p className="text-xs text-ink/90 italic bg-mist/60 p-3 rounded-control border border-hairline">
                  "{req.message}"
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-moss">Requested: Scorecard & Projects</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                  >
                    Quick Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RECOMMENDED NEXT CHALLENGE */}
      <section className="border border-hairline rounded-feature bg-mesh p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-verdant-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-verdant-700" />
            <span>Recommended for you</span>
          </div>
          <h3 className="font-display font-semibold text-lg sm:text-xl text-ink">
            Advance your verified competency in {suggestedSkill}
          </h3>
          <p className="text-xs sm:text-sm text-moss leading-relaxed">
            Take on an advanced industry-aligned brief with strict evaluation rubrics to push your
            score into the Senior Benchmark tier.
          </p>
        </div>

        <Link to={`/projects/new?skill=${suggestedSkill.toLowerCase()}`} className="shrink-0">
          <Button variant="accent" size="default" className="shadow-sm">
            <span>Get this project</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </section>

      {/* POPUP MODAL 1: SHARE PROOF LINK & QR CODE */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-verdant-700" />
              <span>Share Verified Credentials</span>
            </DialogTitle>
            <DialogDescription>
              Share your tamper-evident verification link. Anyone with this link can inspect your
              verified skills without logging in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-mist rounded-panel border border-hairline">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Credential QR Code"
                  className="w-40 h-40 rounded-control border border-hairline shadow-sm"
                />
              ) : (
                <div className="w-40 h-40 bg-canvas rounded flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-moss animate-pulse" />
                </div>
              )}
              <span className="text-[11px] text-moss mt-2 font-mono">
                Credential: {profile.credential_id || 'credential-88219'}
              </span>
            </div>

            {/* Link Copy Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-moss uppercase tracking-wider">
                Public Verification URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/verify/${profile.credential_id || 'credential-88219'}`}
                  className="flex-1 h-10 px-3 rounded-control bg-mist text-ink text-xs font-mono border border-hairline select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="h-10 px-3 rounded-control bg-verdant-700 hover:bg-verdant-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Privacy Guarantee Pill */}
            <div className="p-3 bg-verdant-50 rounded-control border border-verdant-200 text-xs text-verdant-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-verdant-700 shrink-0 mt-0.5" />
              <span>
                <strong>Blind & Private:</strong> This link shows only your verified scores and
                evidence rubrics. Your personal email and contact info remain protected.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsShareModalOpen(false)}>
                Close
              </Button>
              <Link
                to={`/verify/${profile.credential_id || 'credential-88219'}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="primary">
                  <span>Open Verify Page</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* POPUP MODAL 2: QUICK REVIEW & GRANT ACCESS */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-verdant-700" />
              <span>Grant Employer Access</span>
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.organization_name} wants to inspect your verified skill scorecard.
            </DialogDescription>
          </DialogHeader>

          {grantSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-verdant-700 mx-auto animate-bounce" />
              <h4 className="font-display font-semibold text-lg text-ink">Access Granted!</h4>
              <p className="text-xs text-moss">
                {selectedRequest?.organization_name} has been granted {grantDuration} days access to your
                verified profile.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-mist rounded-control border border-hairline text-xs text-ink/90 italic">
                "{selectedRequest?.message}"
              </div>

              {/* Scopes checklist preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-moss uppercase tracking-wider block">
                  Permissions Requested:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-ink">
                    <Check className="w-3.5 h-3.5 text-verdant-700" />
                    <span>Verified Skill Scorecards & Rubrics</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink">
                    <Check className="w-3.5 h-3.5 text-verdant-700" />
                    <span>Project Submissions & Code Demonstrations</span>
                  </div>
                </div>
              </div>

              {/* Duration selector using sleek RichSelect */}
              <div className="space-y-1.5">
                <RichSelect
                  label="Access Duration"
                  value={String(grantDuration)}
                  onValueChange={(val) =>
                    setGrantDuration(parseInt(val, 10) as 7 | 30 | 90)
                  }
                  options={[
                    {
                      value: '30',
                      label: '30 Days Access (Recommended for Interviews)',
                      badge: 'Recommended',
                      description: 'Standard evaluation window for active hiring loops.',
                    },
                    {
                      value: '7',
                      label: '7 Days Access (Fast Review)',
                      badge: 'Short',
                      description: 'Quick snapshot view for screening calls.',
                    },
                    {
                      value: '90',
                      label: '90 Days Access (Extended Cohort Review)',
                      badge: 'Extended',
                      description: 'Full semester visibility for talent pipelines.',
                    },
                  ]}
                />
              </div>

              <p className="text-[11px] text-moss">
                You can revoke or modify this access at any time from your Sharing settings.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-hairline">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isGranting}
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  onClick={handleQuickGrant}
                  isLoading={isGranting}
                >
                  Grant Access ({grantDuration} Days)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomePage;
