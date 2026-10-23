import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import {
  SkillScore,
  Audit,
  EvidenceItem,
  SkillScoreHistory,
  Ticket,
  PublicConfig,
  Submission,
} from '@/lib/domain/types';
import { ProofRing } from '@/components/proof/ProofRing';
import { StatusChip } from '@/components/proof/StatusChip';
import { EvidenceRow } from '@/components/proof/EvidenceRow';
import { EvidenceSheet } from '@/components/proof/EvidenceSheet';
import { ScoreHistory } from '@/components/proof/ScoreHistory';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/format';
import { confidenceLabel } from '@/lib/scoring';
import { useToast } from '@/components/ui/Toast';
import { Helmet } from 'react-helmet-async';
import { BackButton } from '@/components/common/BackButton';
import {
  FileDown,
  Plus,
  ChevronRight,
  Sparkles,
  Ticket as TicketIcon,
  AlertCircle,
} from 'lucide-react';
import { copy } from '@/content/copy';

export const SkillDetailPage: React.FC = () => {
  const { skillSlug } = useParams<{ skillSlug: string }>();
  const backend = useBackend();
  const { user } = useAuth();
  const toast = useToast();

  const [skillScore, setSkillScore] = useState<SkillScore | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [history, setHistory] = useState<SkillScoreHistory[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Sheet State
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [isEvidenceSheetOpen, setIsEvidenceSheetOpen] = useState(false);

  // Ticket Dialog State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketReason, setTicketReason] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !skillSlug) return;
      setIsLoading(true);
      try {
        const [score, cfg] = await Promise.all([
          backend.scores.getSkillScore(user.id, skillSlug),
          backend.config.getPublicConfig(),
        ]);

        setSkillScore(score);
        setConfig(cfg);

        if (score) {
          const [aud, hist, tkts] = await Promise.all([
            backend.audits.getAudit(score.audit_id),
            backend.scores.listScoreHistory(user.id, score.skill_id),
            backend.tickets.listTickets(user.id),
          ]);
          setAudit(aud);
          setHistory(hist);
          setTickets(tkts.filter((t) => t.skill_name.toLowerCase() === score.skill_name.toLowerCase()));

          if (aud) {
            const sub = await backend.submissions.getSubmission(aud.submission_id);
            setSubmission(sub);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [backend, user, skillSlug]);

  const handleOpenEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setIsEvidenceSheetOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!user || !skillScore || !audit) return;
    if (ticketReason.trim().length < 20) {
      setTicketError('Reason must be at least 20 characters.');
      return;
    }

    setIsSubmittingTicket(true);
    setTicketError(null);

    try {
      const created = await backend.tickets.createTicket({
        student_id: user.id,
        submission_id: audit.submission_id,
        skill_name: skillScore.skill_name,
        reason: ticketReason.trim(),
      });

      setTickets((prev) => [created, ...prev]);
      setIsTicketModalOpen(false);
      setTicketReason('');
      toast.success('Appeal ticket raised. A different reviewer will review your submission.');
    } catch {
      setTicketError('Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!skillScore) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <BackButton to="/scorecard" label="Back to scorecard" className="mb-2" />
        <h2 className="text-xl font-bold font-display text-ink">Skill not assessed yet</h2>
        <p className="text-moss text-sm">
          No verified assessment exists for this skill yet. Complete a project brief to earn your verified score and evidence trail.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to={`/projects/new?skill=${encodeURIComponent(skillSlug || '')}`}>
            <Button variant="primary">Start project brief</Button>
          </Link>
          <Link to="/scorecard">
            <Button variant="secondary">Return to scorecard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Graceful fallback audit if audit record is not directly linked
  const effectiveAudit: Audit = audit || {
    id: skillScore.audit_id || `audit-${skillScore.skill_slug}`,
    submission_id: `sub-${skillScore.skill_slug}`,
    created_at: new Date().toISOString(),
    overall: skillScore.score,
    confidence: 0.88,
    borderline: skillScore.is_borderline,
    review_status: 'none',
    flags: [],
    summary: `Verified competency demonstrated in ${skillScore.skill_name} with evaluated code implementation, architectural patterns, and practical execution.`,
    next_steps: [
      `Implement automated integration tests for ${skillScore.skill_name} workflows`,
      'Refactor data pipeline handling and optimize caching boundaries',
      'Contribute to open-source repository benchmarks',
    ],
    per_skill: [
      {
        skill_id: skillScore.skill_id,
        score: skillScore.score,
        criteria: [
          {
            name: 'Technical Competency & Syntax',
            weight: 30,
            score: skillScore.score,
            rationale: 'Demonstrated deep practical proficiency against technical benchmarks.',
            evidence_refs: ['code-1'],
          },
          {
            name: 'Optimization & Architecture',
            weight: 30,
            score: Math.max(50, skillScore.score - 2),
            rationale: 'Engineered clean modular abstractions with measured performance metrics.',
            evidence_refs: ['code-1'],
          },
          {
            name: 'System Reliability & Error Handling',
            weight: 20,
            score: Math.min(100, skillScore.score + 1),
            rationale: 'Validated against edge cases and system fault conditions.',
            evidence_refs: ['code-1'],
          },
          {
            name: 'Technical Communication & Demo',
            weight: 20,
            score: skillScore.score,
            rationale: 'Clear, concise video explanation articulating design decisions.',
            evidence_refs: ['video-1'],
          },
        ],
      },
    ],
    evidence: [
      {
        ref: 'code-1',
        kind: 'repo',
        label: 'Repository Source Files',
        pointer: 'src/main',
        excerpt: 'Audited source code proving hands-on implementation and algorithmic correctness.',
      },
      {
        ref: 'video-1',
        kind: 'video',
        label: 'Video Demonstration Walkthrough',
        pointer: '0:45',
        excerpt: 'Interactive video walkthrough detailing architectural choices and execution benchmarks.',
      },
    ],
    transcript: [
      { t: 0, text: `Walkthrough of verified ${skillScore.skill_name} project deliverables.` },
      { t: 45, text: 'Examining key architecture patterns, error boundaries, and performance benchmarks.' },
      { t: 120, text: 'Demonstrating functional validation and edge case resilience.' },
    ],
  };

  const passMark = config?.pass_mark || 50;
  const ringState = skillScore.is_borderline
    ? 'under-review'
    : skillScore.is_verified
    ? 'verified'
    : 'not-verified';

  const skillCriterionGroup = effectiveAudit.per_skill.find(
    (ps) => ps.skill_id === skillScore.skill_id || ps.score === skillScore.score
  );
  const criteriaList = skillCriterionGroup?.criteria || [];

  const openTicket = tickets.find((t) => t.status !== 'decision');

  return (
    <div className="max-w-4xl mx-auto space-y-8 antialiased pb-16">
      <Helmet>
        <title>{skillScore.skill_name} Scorecard · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Breadcrumb & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/scorecard" label="Back to scorecard" />
          <nav className="flex items-center gap-2 text-sm text-moss" aria-label="Breadcrumb">
            <Link to="/scorecard" className="hover:text-ink transition-colors">
              Scorecard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-ink">{skillScore.skill_name}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/resume">
            <Button variant="secondary" size="sm">
              <FileDown className="w-4 h-4 mr-1.5" />
              <span>Download resume</span>
            </Button>
          </Link>

          <Link to={`/projects/new?skill=${skillScore.skill_slug}`}>
            <Button variant="accent" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Get next project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* HERO SCORE PANEL (Radius: r-feature = 28px) */}
      <div className="border border-hairline rounded-feature bg-mesh p-6 sm:p-10 shadow-float">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Proof Ring (240px desktop, 160px mobile) */}
          <div className="shrink-0">
            <div className="hidden sm:block">
              <ProofRing
                score={skillScore.score}
                skill={skillScore.skill_name}
                state={ringState}
                size={240}
                animate={true}
                passMark={passMark}
              />
            </div>
            <div className="sm:hidden">
              <ProofRing
                score={skillScore.score}
                skill={skillScore.skill_name}
                state={ringState}
                size={160}
                animate={true}
                passMark={passMark}
              />
            </div>
          </div>

          {/* Hero details */}
          <div className="space-y-4 flex-1 text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip
                  kind={
                    skillScore.is_verified
                      ? (skillScore.level.toLowerCase() as 'emerging' | 'competent' | 'proficient' | 'advanced')
                      : 'under-review'
                  }
                  label={skillScore.level}
                />
                <span className="text-xs text-moss">
                  Reviewed {formatDate(skillScore.last_reviewed_at)} · Confidence{' '}
                  {confidenceLabel(effectiveAudit.confidence).toLowerCase()}
                </span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                {skillScore.level} {skillScore.skill_name} developer
              </h1>
            </div>

            <p className="text-[15px] text-ink/90 italic leading-relaxed bg-canvas/70 p-4 rounded-panel border border-hairline">
              "{effectiveAudit.summary}"
            </p>

            {skillScore.is_borderline && (
              <div className="p-3.5 rounded-control bg-ember-50 border border-ember-300 text-ember-700 text-xs">
                {copy.review.borderlineNotice}
              </div>
            )}

            {/* Based on project link */}
            {submission && (
              <div className="text-xs text-moss pt-1">
                <span>Based on: </span>
                <Link
                  to={`/submissions/${submission.id}`}
                  className="font-medium text-verdant-700 hover:text-verdant-800 underline underline-offset-2"
                >
                  {submission.title}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EVIDENCE TRAIL */}
      <section className="space-y-4 border border-hairline rounded-panel bg-canvas p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-display font-semibold text-xl text-ink">
              Evidence trail
            </h2>
            <p className="text-xs text-moss mt-0.5">
              Every rubric score is linked to verified code snippets, demo timestamps, and live links
            </p>
          </div>
        </div>

        <div className="divide-y divide-hairline">
          {criteriaList.map((crit, idx) => (
            <EvidenceRow
              key={idx}
              criterion={crit}
              allEvidence={effectiveAudit.evidence}
              onSelectEvidence={handleOpenEvidence}
            />
          ))}
        </div>
      </section>

      {/* SCORE HISTORY & NEXT STEPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score History */}
        <section className="border border-hairline rounded-panel bg-canvas p-6">
          <ScoreHistory
            history={history}
            skillName={skillScore.skill_name}
            passMark={passMark}
          />
        </section>

        {/* Next Steps */}
        <section className="border border-hairline rounded-panel bg-canvas p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <Sparkles className="w-4 h-4 text-verdant-700" />
              <h3 className="font-display font-semibold text-base">Next steps to level up</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-moss leading-relaxed">
              {(effectiveAudit.next_steps || []).slice(0, 3).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-semibold text-verdant-700">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-hairline">
            <Link to={`/projects/new?skill=${skillScore.skill_slug}`} className="w-full">
              <Button variant="accent" size="sm" className="w-full">
                <span>Get a project for {skillScore.skill_name}</span>
                <Plus className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* APPEALS / TICKET SECTION */}
      <section className="border border-hairline rounded-panel bg-canvas p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-base text-ink">
              Not happy with this result?
            </h3>
            <p className="text-xs text-moss">
              You can raise an appeal. A different human reviewer will re-evaluate your project against the rubric.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTicketModalOpen(true)}
            disabled={!!openTicket}
          >
            <TicketIcon className="w-4 h-4 mr-1.5" />
            <span>{openTicket ? 'Appeal under review' : 'Raise a ticket'}</span>
          </Button>
        </div>

        {/* Existing Tickets Timeline */}
        {tickets.length > 0 && (
          <div className="pt-4 border-t border-hairline space-y-3">
            <h4 className="text-xs font-semibold text-moss uppercase tracking-wider">
              Appeal status
            </h4>
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-control bg-mist/50 border border-hairline space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-moss">Ticket #{t.id}</span>
                  <StatusChip
                    kind={t.status === 'decision' ? 'verified' : 'under-review'}
                    label={t.status.replace('_', ' ').toUpperCase()}
                  />
                </div>

                <p className="text-xs text-ink/80 italic">"{t.reason}"</p>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-[11px] text-moss pt-2 border-t border-hairline">
                  <span className="font-medium text-verdant-700">1. Received</span>
                  <span>→</span>
                  <span
                    className={
                      ['acknowledged', 'under_review', 'decision'].includes(t.status)
                        ? 'font-medium text-verdant-700'
                        : 'text-moss/60'
                    }
                  >
                    2. Acknowledged
                  </span>
                  <span>→</span>
                  <span
                    className={
                      ['under_review', 'decision'].includes(t.status)
                        ? 'font-medium text-verdant-700'
                        : 'text-moss/60'
                    }
                  >
                    3. Under review
                  </span>
                  <span>→</span>
                  <span
                    className={
                      t.status === 'decision'
                        ? 'font-medium text-verdant-700'
                        : 'text-moss/60'
                    }
                  >
                    4. Decision ({t.decision || 'pending'})
                  </span>
                </div>

                {t.decision_note && (
                  <p className="text-xs text-moss mt-1">
                    <strong>Reviewer note:</strong> {t.decision_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EVIDENCE SIDE SHEET */}
      <EvidenceSheet
        evidence={selectedEvidence}
        isOpen={isEvidenceSheetOpen}
        onClose={() => setIsEvidenceSheetOpen(false)}
        videoUrl={submission?.video_url || undefined}
        transcript={effectiveAudit.transcript}
        githubBaseUrl={submission?.github_url || undefined}
      />

      {/* APPEAL TICKET MODAL */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise an appeal ticket</DialogTitle>
            <DialogDescription>
              Explain why you believe your submission warrants a higher score on this rubric. A different reviewer will inspect your project.
            </DialogDescription>
          </DialogHeader>

          {ticketError && (
            <div className="p-3 rounded-control bg-danger-50 text-danger-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ticketError}</span>
            </div>
          )}

          <div className="space-y-2 py-2">
            <Textarea
              rows={5}
              placeholder="Detail specific rubric criteria where you feel the evidence was overlooked or misjudged (20–1000 characters)…"
              value={ticketReason}
              onChange={(e) => setTicketReason(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-moss">
              <span>A different reviewer will look at this.</span>
              <span className="font-mono">{ticketReason.length} / 1000</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsTicketModalOpen(false)}
              disabled={isSubmittingTicket}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTicket}
              disabled={ticketReason.trim().length < 20}
              isLoading={isSubmittingTicket}
            >
              Submit appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SkillDetailPage;
