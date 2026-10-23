import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { Submission, AgentRun, Audit, PublicConfig } from '@/lib/domain/types';
import { ProofRing } from '@/components/proof/ProofRing';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/common/BackButton';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Mail,
  ExternalLink,
  Github,
  Video,
  ArrowRight,
} from 'lucide-react';
import { copy } from '@/content/copy';
import { env } from '@/config/env';

const AUDIT_STAGES = [
  { key: 'received', label: copy.review.stages.received },
  { key: 'reading', label: copy.review.stages.reading },
  { key: 'watching', label: copy.review.stages.watching },
  { key: 'scoring', label: copy.review.stages.scoring },
  { key: 'writing', label: copy.review.stages.writing },
  { key: 'done', label: copy.review.stages.done },
] as const;

export const ReviewProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const backend = useBackend();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Load public config
  useEffect(() => {
    backend.config.getPublicConfig().then(setConfig);
  }, [backend]);

  // Load submission and audit
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      const sub = await backend.submissions.getSubmission(id);
      setSubmission(sub);
      if (sub && (sub.status === 'scored' || sub.status === 'needs_review')) {
        const aud = await backend.audits.getAudit(id);
        setAudit(aud);
      }
      const run = await backend.audits.getAgentRun(id);
      setAgentRun(run);
    };

    loadData();

    // Subscribe to realtime agent run updates
    const unsubscribe = backend.audits.subscribeAgentRun(id, (updatedRun) => {
      setAgentRun(updatedRun);
      if (updatedRun.status === 'completed' || updatedRun.stage === 'done') {
        backend.submissions.getSubmission(id).then((sub) => {
          setSubmission(sub);
          if (sub) {
            backend.audits.getAudit(id).then(setAudit);
          }
        });
      }
      if (updatedRun.status === 'failed') {
        backend.submissions.getSubmission(id).then(setSubmission);
      }
    });

    // Fallback polling every 5s while in progress
    const pollInterval = setInterval(() => {
      backend.submissions.getSubmission(id).then((sub) => {
        if (sub) {
          setSubmission(sub);
          if (sub.status === 'scored' || sub.status === 'needs_review') {
            backend.audits.getAudit(id).then(setAudit);
            clearInterval(pollInterval);
          }
        }
      });
      backend.audits.getAgentRun(id).then((r) => {
        if (r) setAgentRun(r);
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [id, backend]);

  const handleRetry = async () => {
    if (!id) return;
    setIsRetrying(true);
    try {
      await backend.submissions.retrySubmission(id);
      const sub = await backend.submissions.getSubmission(id);
      setSubmission(sub);
      const run = await backend.audits.getAgentRun(id);
      setAgentRun(run);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isAuditing = submission.status === 'auditing' || submission.status === 'submitted';
  const isFailed = submission.status === 'failed';
  const isScored = submission.status === 'scored';
  const isNeedsReview = submission.status === 'needs_review';
  const currentStage = agentRun?.stage || 'received';
  const currentStageIdx = AUDIT_STAGES.findIndex((s) => s.key === currentStage);
  const primarySkill = submission.skills_claimed[0] || 'Skill';
  const skillSlug = primarySkill.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <div className="max-w-3xl mx-auto space-y-8 antialiased pb-16">
      <Helmet>
        <title>{submission.title} · Review Status</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton to="/projects" label="Back to projects" className="mb-2" />
      </div>

      {/* Kill Switch Banner */}
      {config?.ai_kill_switch && (
        <div className="p-4 rounded-panel bg-mist border border-hairline text-moss text-sm">
          {copy.review.pausedTitle}
        </div>
      )}

      {/* 1. AUDITING IN PROGRESS */}
      {isAuditing && (
        <div className="border border-hairline rounded-panel bg-canvas p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
              {copy.review.submittedHeadline}
            </h1>
            <p className="text-moss text-[15px]">{copy.review.submittedSubtext}</p>
          </div>

          {/* Audit progress steps list */}
          <div
            className="space-y-4 py-4"
            role="status"
            aria-live="polite"
            aria-label="Review progress steps"
          >
            {AUDIT_STAGES.map((step, idx) => {
              const isPast = currentStageIdx > idx;
              const isCurrent = currentStageIdx === idx;
              const isFuture = currentStageIdx < idx;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                    {isPast && (
                      <CheckCircle2 className="w-5 h-5 text-verdant-700 stroke-[2.2]" />
                    )}
                    {isCurrent && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember-500 opacity-75 motion-reduce:animate-none" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-ember-500" />
                      </span>
                    )}
                    {isFuture && (
                      <span className="w-3.5 h-3.5 rounded-full border border-hairline bg-transparent" />
                    )}
                  </div>

                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-semibold text-ink'
                        : isPast
                        ? 'font-medium text-moss line-through opacity-80'
                        : 'text-moss/60'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-moss border-t border-hairline">
            Automated evaluation against rubric <code>web-frontend@1</code>.
          </div>
        </div>
      )}

      {/* 2. SCORED SUCCESS BANNER */}
      {isScored && audit && (
        <div className="border border-verdant-300 rounded-feature bg-verdant-50/50 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-verdant-800">
                Review completed
              </span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                Your {primarySkill} score is ready.
              </h1>
              <p className="text-moss text-[15px] leading-relaxed max-w-lg">
                {audit.summary}
              </p>
            </div>

            <div className="shrink-0 flex justify-center">
              <ProofRing
                score={audit.overall}
                skill={primarySkill}
                state="verified"
                size={160}
                animate={true}
                passMark={config?.pass_mark}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-verdant-200/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <StatusChip kind="verified" label={`Verified ${audit.overall} / 100`} />
              <span className="text-xs text-moss">Confidence high</span>
            </div>

            <Link to={`/scorecard/${skillSlug}`}>
              <Button variant="primary" size="lg">
                <span>View full scorecard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 3. BORDERLINE / UNDER HUMAN REVIEW BANNER */}
      {isNeedsReview && (
        <div className="border border-ember-300 rounded-feature bg-ember-50/50 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <StatusChip kind="under-review" label="Borderline assessment" />
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                Under human review
              </h1>
              <p className="text-moss text-[15px] leading-relaxed max-w-lg">
                {copy.review.borderlineNotice}
              </p>
              <p className="text-xs text-ember-700">
                {copy.review.borderlineSharingNote}
              </p>
            </div>

            <div className="shrink-0 flex justify-center">
              <ProofRing
                score={audit?.overall || 54}
                skill={primarySkill}
                state="under-review"
                size={160}
                animate={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. FAILED BANNER WITH RETRY */}
      {isFailed && (
        <div className="border border-danger-600/30 rounded-panel bg-danger-50 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-display font-semibold text-lg text-ink">
                Review couldn't complete
              </h2>
              <p className="text-sm text-moss leading-relaxed">
                {copy.review.failedTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="default"
              onClick={handleRetry}
              isLoading={isRetrying}
            >
              <RotateCw className="w-4 h-4 mr-1.5" />
              <span>Retry review</span>
            </Button>
            <a
              href={`mailto:${env.VITE_SUPPORT_EMAIL}?subject=Review%20Issue%20${submission.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-moss hover:text-ink font-medium"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact support</span>
            </a>
          </div>
        </div>
      )}

      {/* SUBMISSION SUMMARY DESCRIPTION LIST */}
      <section className="border border-hairline rounded-panel bg-canvas p-6 space-y-5">
        <h2 className="font-display font-semibold text-lg text-ink">
          Submission details
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <dt className="text-xs font-medium text-moss">Project title</dt>
            <dd className="font-semibold text-ink mt-0.5">{submission.title}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-moss">Skills claimed</dt>
            <dd className="flex flex-wrap gap-1.5 mt-1">
              {submission.skills_claimed.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-mist text-ink border border-hairline"
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>

          {submission.github_url && (
            <div>
              <dt className="text-xs font-medium text-moss">GitHub repository</dt>
              <dd className="mt-0.5">
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-verdant-700 hover:text-verdant-800 underline inline-flex items-center gap-1 text-xs"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[240px]">{submission.github_url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </dd>
            </div>
          )}

          {submission.live_url && (
            <div>
              <dt className="text-xs font-medium text-moss">Live URL</dt>
              <dd className="mt-0.5">
                <a
                  href={submission.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-verdant-700 hover:text-verdant-800 underline inline-flex items-center gap-1 text-xs"
                >
                  <span className="truncate max-w-[240px]">{submission.live_url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-xs font-medium text-moss">Demo video</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-xs text-ink">
              <Video className="w-3.5 h-3.5 text-moss" />
              <span>
                {submission.video_url ? 'Attached demo video' : 'Video link provided'}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-moss">AI use disclosure</dt>
            <dd className="mt-0.5 text-xs text-ink">
              {submission.ai_used ? (
                <span>
                  Disclosed ({submission.ai_tools.join(', ') || 'AI tools used'})
                </span>
              ) : (
                <span>No AI tools used</span>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
export default ReviewProgressPage;
