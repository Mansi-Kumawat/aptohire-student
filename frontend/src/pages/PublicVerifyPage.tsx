import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { PublicCredential } from '@/lib/domain/types';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Logo } from '@/components/brand/Logo';
import { Helmet } from 'react-helmet-async';
import {
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export const PublicVerifyPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const backend = useBackend();

  const [credential, setCredential] = useState<PublicCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadVerification = async () => {
      if (!credentialId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setNotFound(false);
      try {
        const result = await backend.student.getPublicCredential(credentialId);
        if (!cancelled) {
          setCredential(result);
          setNotFound(!result);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadVerification();
    return () => { cancelled = true; };
  }, [backend, credentialId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 max-w-lg w-full rounded-panel" />
      </div>
    );
  }

  if (notFound || !credential) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-moss mb-3" />
        <h1 className="text-2xl font-bold font-display text-ink mb-2">Credential not found</h1>
        <p className="text-sm text-moss max-w-md mb-6">
          The credential ID <code className="font-mono bg-mist px-2 py-0.5 rounded text-ink">{credentialId}</code> does not match an issued AptoHire verification record.
        </p>
        <Link to="/login">
          <Button variant="primary">Go to Student Portal</Button>
        </Link>
      </div>
    );
  }

  const verifiedScores = credential.skills;

  return (
    <div className="min-h-screen bg-mesh/50 antialiased py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <Helmet>
        <title>Credential {credential.credential_id} · AptoHire Verification</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Logo showPortalBadge={false} />
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-verdant-100/80 text-verdant-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official Proof-of-Skill Certificate</span>
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-2xl bg-canvas border border-hairline rounded-panel shadow-sm overflow-hidden">
        {/* Certificate Banner */}
        <div className="p-6 sm:p-8 border-b border-hairline bg-gradient-to-b from-mist/40 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-moss font-semibold">
                Issued Credential ID: {credential.credential_id}
              </span>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mt-1">
                {credential.display_name || 'Verified Student'}
              </h1>
            </div>

            {verifiedScores.length > 0 ? (
              <StatusChip kind="verified" label="AptoHire Verified" />
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-mist text-moss border border-hairline">
                In progress · No verified skills yet
              </span>
            )}
          </div>

          {/* Institutional Affiliation */}
          {credential.affiliation && (
            <div className="mt-4 pt-4 border-t border-hairline/80 flex items-center gap-2 text-xs text-moss font-medium">
              <GraduationCap className="w-4 h-4 text-verdant-700 shrink-0" />
              <span>{credential.affiliation.label}</span>
              {credential.affiliation.verification !== 'unverified' && (
                <StatusChip kind="verified-university" className="text-[11px] py-0 px-2 ml-1" />
              )}
            </div>
          )}
        </div>

        {/* Verified Skills Section */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-ink">
                Verified Skill Competencies
              </h2>
              <span className="text-xs text-moss font-medium">
                Audited against rubric standards
              </span>
            </div>

            {verifiedScores.length === 0 ? (
              <div className="p-6 rounded-control bg-mist/30 border border-dashed border-hairline text-center space-y-1">
                <p className="text-sm font-medium text-ink">No verified skills scored above pass mark yet</p>
                <p className="text-xs text-moss">
                  This student is registered and actively completing project assignments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verifiedScores.map((score) => (
                  <div
                    key={score.name}
                    className="p-4 rounded-control border border-hairline bg-canvas flex items-center justify-between shadow-sm"
                  >
                    <h3 className="font-semibold text-sm text-ink">{score.name}</h3>
                    <div className="flex items-center gap-2">
                      <StatusChip kind="verified" label={score.level} />
                      {credential.shared_fields.includes('scores') && typeof score.score === 'number' && (
                        <span className="font-mono text-xs font-bold text-ink tabular-nums">
                          {score.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tamper-evident Audit Guarantee */}
          <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-moss">
            <div className="flex items-center gap-1.5 text-verdant-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-verdant-700 shrink-0" />
              <span>Multi-modal code review & video proof verified</span>
            </div>
            <Link
              to="/login"
              className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2 flex items-center gap-1"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVerifyPage;
