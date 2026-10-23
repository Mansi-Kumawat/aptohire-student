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
  PublicConfig,
} from '@/lib/domain/types';
import { ProofRing } from '@/components/proof/ProofRing';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Helmet } from 'react-helmet-async';
import {
  Sparkles,
  ArrowRight,
  Share2,
  Building2,
  Plus,
} from 'lucide-react';
import { copy } from '@/content/copy';

export const HomePage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<SkillScore[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [proposals, setProposals] = useState<AffiliationProposal[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [prof, scs, reqs, asgs, subs, props, cfg] = await Promise.all([
          backend.student.getProfile(user.id),
          backend.scores.listSkillScores(user.id),
          backend.sharing.listAccessRequests(user.id),
          backend.projects.listAssignments(user.id),
          backend.submissions.listSubmissions(user.id),
          backend.affiliations.listProposals(user.id),
          backend.config.getPublicConfig(),
        ]);
        setProfile(prof);
        setSkills(scs);
        setRequests(reqs);
        setAssignments(asgs);
        setSubmissions(subs);
        setProposals(props);
        setConfig(cfg);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [backend, user]);

  if (isLoading || !profile) {
    return (
      <div className="space-y-6 antialiased pb-12">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const firstName = profile.full_name.split(' ')[0] || 'Student';

  // Compute "What to do next" by priority order (Section 8.2)
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

  // Weakest skill or suggestion for next project
  const suggestedSkill = skills.length > 0 ? skills[0].skill_name : 'React';

  return (
    <div className="space-y-8 antialiased pb-16">
      <Helmet>
        <title>Home · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight">
          Welcome back, {firstName}.
        </h1>
        <p className="text-moss text-[15px]">
          Here is your current skill status and opportunities
        </p>
      </div>

      {/* WHAT TO DO NEXT BLOCK (Priority Order) */}
      <div className="border border-hairline rounded-panel bg-canvas p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-verdant-800">
          <Sparkles className="w-4 h-4 text-verdant-700" />
          <span>What to do next</span>
        </div>

        {/* Priority 1: Pending affiliation proposal */}
        {pendingProposal ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                {copy.university.confirmNewProposal(pendingProposal.university_name)}
              </h3>
              <p className="text-xs text-moss">
                Confirm your new masters/alumni affiliation. Your verified scores remain intact.
              </p>
            </div>
            <Link to="/profile?tab=education">
              <Button variant="primary" size="sm">
                Confirm affiliation
              </Button>
            </Link>
          </div>
        ) : activeSubmission ? (
          /* Priority 2: Review in progress */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Review in progress: {activeSubmission.title}
              </h3>
              <p className="text-xs text-moss">
                Evaluation against rubric is currently running. You can check live progress.
              </p>
            </div>
            <Link to={`/submissions/${activeSubmission.id}`}>
              <Button variant="primary" size="sm">
                <span>View review progress</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : justReadySubmission ? (
          /* Priority 3: Score just ready */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Your score is ready for {justReadySubmission.title}.
              </h3>
              <p className="text-xs text-moss">
                Review your rubric scores and verified evidence breakdown.
              </p>
            </div>
            <Link to={`/submissions/${justReadySubmission.id}`}>
              <Button variant="primary" size="sm">
                <span>View scorecard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : pendingRequests.length > 0 ? (
          /* Priority 4: Pending access requests */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                {pendingRequests.length} access {pendingRequests.length === 1 ? 'request is' : 'requests are'} waiting for you.
              </h3>
              <p className="text-xs text-moss">
                {pendingRequests[0].organization_name} wants to review your verified skills.
              </p>
            </div>
            <Link to="/sharing">
              <Button variant="primary" size="sm">
                <span>Review requests</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : activeDraft ? (
          /* Priority 5: Draft in progress */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Continue project: {activeDraft.title}
              </h3>
              <p className="text-xs text-moss">
                Your draft is saved. Finish your deliverables and upload your demo video.
              </p>
            </div>
            <Link to={`/submissions/${activeDraft.id}/edit`}>
              <Button variant="primary" size="sm">
                <span>Resume draft</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : assignedProject ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Start brief: {assignedProject.brief.title}
              </h3>
              <p className="text-xs text-moss">
                Review deliverables and rubric preview for {assignedProject.target_skill}.
              </p>
            </div>
            <Link to={`/projects/${assignedProject.id}`}>
              <Button variant="primary" size="sm">
                <span>Open brief</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          /* Priority 6: No projects -> Accent button Get a project */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-base text-ink">
                Prove what you can do
              </h3>
              <p className="text-xs text-moss">
                Select a target skill to get your first tailored project brief.
              </p>
            </div>
            <Link to="/projects/new">
              <Button variant="accent" size="default">
                <span>Get a project</span>
                <Plus className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* PLAIN STAT ROW (Hairline-divided, no cards as specified in 6.2 & 8.2) */}
      <div className="grid grid-cols-3 border-y border-hairline py-4 select-none">
        <div className="px-4 text-center sm:text-left">
          <span className="font-display font-semibold text-2xl sm:text-3xl text-ink tabular-nums block">
            {verifiedSkillsCount}
          </span>
          <span className="text-xs text-moss font-medium">Verified skills</span>
        </div>
        <div className="px-4 border-l border-hairline text-center sm:text-left">
          <span className="font-display font-semibold text-2xl sm:text-3xl text-ink tabular-nums block">
            {projectsReviewedCount}
          </span>
          <span className="text-xs text-moss font-medium">Projects reviewed</span>
        </div>
        <div className="px-4 border-l border-hairline text-center sm:text-left">
          <span className="font-display font-semibold text-2xl sm:text-3xl text-ink tabular-nums block">
            {activeSharingCount}
          </span>
          <span className="text-xs text-moss font-medium">Active sharing</span>
        </div>
      </div>

      {/* YOUR SKILLS LIST (56px Rings) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-ink">Your skills</h2>
          {skills.length > 0 && (
            <Link
              to="/scorecard"
              className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {skills.length === 0 ? (
          <div className="p-8 border border-hairline rounded-panel bg-canvas text-center">
            <p className="text-sm text-moss mb-4">No skills yet. Get your first project.</p>
            <Link to="/projects/new">
              <Button variant="accent" size="sm">
                Get a project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-hairline border border-hairline rounded-panel bg-canvas">
            {skills.map((skill) => {
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

                  <div className="flex items-center gap-3">
                    <StatusChip
                      kind={
                        skill.is_verified
                          ? (skill.level.toLowerCase() as 'emerging' | 'competent' | 'proficient' | 'advanced')
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

      {/* REQUESTS WAITING (Max 3 AccessRequestCards) */}
      {pendingRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <Share2 className="w-5 h-5 text-moss" />
              <span>Requests waiting</span>
            </h2>
            <Link
              to="/sharing"
              className="text-xs font-semibold text-verdant-700 hover:text-verdant-800"
            >
              View in Sharing
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-panel border border-hairline bg-canvas space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-moss" />
                    <span className="font-semibold text-sm text-ink">{req.organization_name}</span>
                  </div>
                  <StatusChip kind="pending" />
                </div>

                <p className="text-xs text-ink/90 line-clamp-2 italic">"{req.message}"</p>

                <div className="pt-2 flex justify-end">
                  <Link to="/sharing">
                    <Button variant="secondary" size="sm" className="text-xs">
                      Review request
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SUGGESTED NEXT PROJECT */}
      <section className="border border-hairline rounded-panel bg-mesh p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-verdant-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-verdant-700" />
            <span>Recommended for you</span>
          </div>
          <h3 className="font-display font-semibold text-lg text-ink">
            Advance your verified competency in {suggestedSkill}
          </h3>
          <p className="text-xs text-moss">
            Take on an advanced project to level up your verified scorecard.
          </p>
        </div>

        <Link to={`/projects/new?skill=${suggestedSkill.toLowerCase()}`}>
          <Button variant="accent" size="default" className="shrink-0">
            <span>Get this project</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </section>
    </div>
  );
};
export default HomePage;
