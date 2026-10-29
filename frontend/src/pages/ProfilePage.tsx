import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import {
  StudentProfile,
  Affiliation,
  AffiliationProposal,
  ProfileSource,
  ProfileProposal,
  VisibilitySettings,
  UniversityPublic,
  SkillScore,
} from '@/lib/domain/types';
import { Tabs } from '@/components/ui/Tabs';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusChip } from '@/components/proof/StatusChip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { cropAndReencodeAvatar } from '@/lib/media';
import { formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import {
  Link as LinkIcon,
  Camera,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  Github,
  Linkedin,
  Check,
  Sparkles,
} from 'lucide-react';
import { copy } from '@/content/copy';

export const ProfilePage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const tabParam = searchParams.get('tab') as 'overview' | 'education' | 'sources' | 'visibility' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'sources' | 'visibility'>(
    tabParam || 'overview'
  );

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [proposals, setProposals] = useState<AffiliationProposal[]>([]);
  const [sources, setSources] = useState<ProfileSource[]>([]);
  const [sourceProposals, setSourceProposals] = useState<ProfileProposal[]>([]);
  const [universities, setUniversities] = useState<UniversityPublic[]>([]);
  const [scores, setScores] = useState<SkillScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [overviewSavedNotice, setOverviewSavedNotice] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Add University Dialog
  const [isAddUniOpen, setIsAddUniOpen] = useState(false);
  const [addUniType, setAddUniType] = useState<'registered' | 'unregistered'>('registered');
  const [selectedUniId, setSelectedUniId] = useState('');
  const [unregisteredUniName, setUnregisteredUniName] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [programLevel, setProgramLevel] = useState<'ug' | 'pg'>('pg');
  const [uniStatus, setUniStatus] = useState<'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters'>('enrolled');
  const [yearNumber] = useState(1);

  // Disconnect Source Dialog
  const [disconnectSourceId, setDisconnectSourceId] = useState<string | null>(null);
  const [deleteDerivedData, setDeleteDerivedData] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const loadAll = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [prof, affs, props, srcs, sProps, unis, scs] = await Promise.all([
        backend.student.getProfile(user.id),
        backend.affiliations.listAffiliations(user.id),
        backend.affiliations.listProposals(user.id),
        backend.sources.listSources(user.id),
        backend.sources.listProposals(user.id),
        backend.affiliations.listUniversities(),
        backend.scores.listSkillScores(user.id),
      ]);
      setProfile(prof);
      setAffiliations(affs);
      setProposals(props);
      setSources(srcs);
      setSourceProposals(sProps);
      setUniversities(unis);
      setScores(scs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [backend, user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Photo Upload & Re-encode
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024) {
      toast.error('Avatar image must be 1 MB or smaller.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const croppedBlob = await cropAndReencodeAvatar(file);
      const res = await backend.student.uploadAvatar(user.id, croppedBlob);
      setProfile((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : prev));
      toast.success('Profile photo updated.');
    } catch {
      toast.error('Failed to crop or upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    await backend.student.removeAvatar(user.id);
    setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
    toast.success('Profile photo removed.');
  };

  // Save Overview Fields
  const handleSaveOverview = async () => {
    if (!user || !profile) return;
    try {
      await backend.student.updateProfile(user.id, profile);
      setOverviewSavedNotice(true);
      setTimeout(() => setOverviewSavedNotice(false), 3000);
      toast.success('Profile changes saved.');
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  // Confirm Affiliation Proposal (Claim & Merge)
  const handleConfirmProposal = async (proposalId: string) => {
    if (!user) return;
    try {
      await backend.affiliations.confirmAffiliation({
        student_id: user.id,
        proposal_id: proposalId,
      });
      await loadAll();
      toast.success('New university affiliation confirmed. Your scores and credentials did not change.');
    } catch {
      toast.error('Failed to confirm university proposal.');
    }
  };

  // Add Affiliation
  const handleAddAffiliation = async () => {
    if (!user) return;
    const submittedStudentIdNumber = studentIdInput;
    // Raw student IDs must not remain in component state after submission.
    setStudentIdInput('');
    try {
      await backend.affiliations.confirmAffiliation({
        student_id: user.id,
        new: {
          university_id: addUniType === 'registered' ? selectedUniId : undefined,
          university_name_text:
            addUniType === 'unregistered'
              ? unregisteredUniName
              : universities.find((u) => u.id === selectedUniId)?.name,
          student_id_number: submittedStudentIdNumber || undefined,
          program_level: programLevel,
          year: yearNumber,
          status: uniStatus,
        },
      });
      setIsAddUniOpen(false);
      await loadAll();
      toast.success('Affiliation updated.');
    } catch {
      toast.error('Failed to add university.');
    }
  };

  // Copy Credential ID
  const copyCredentialId = () => {
    if (profile?.credential_id) {
      navigator.clipboard.writeText(profile.credential_id);
      toast.success('Credential ID copied.');
    }
  };

  // Toggle Visibility Setting
  const updateVisibilitySetting = async (key: keyof VisibilitySettings, value: boolean) => {
    if (!user || !profile) return;
    const updated = { ...profile.visibility, [key]: value };
    setProfile({ ...profile, visibility: updated });
    await backend.student.updateVisibility(user.id, updated);
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const verifiedScores = scores.filter((s) => s.is_verified && !s.is_borderline);

  const displayedSources: ProfileSource[] = sources.some((item) => item.source === 'github')
    ? sources
    : [...sources, {
        id: 'github-connect-card',
        source: 'github',
        name: 'GitHub',
        connected: false,
        consent_granted: false,
        auto_approve_proposals: false,
      }];

  return (
    <div className="max-w-4xl mx-auto space-y-6 antialiased pb-16">
      <Helmet>
        <title>Student Profile · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            Student profile
          </h1>
          <p className="text-moss text-[15px] mt-0.5">
            Manage your permanent skill identity, affiliations, and verified sources
          </p>
        </div>

        {/* Credential ID badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-2 rounded-control bg-mist border border-hairline flex items-center gap-2 font-mono text-xs">
            <span className="text-moss">Credential:</span>
            <span className="font-semibold text-ink">{profile.credential_id}</span>
            <button
              onClick={copyCredentialId}
              className="p-1 hover:text-verdant-700 text-moss transition-colors"
              title="Copy ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {verifiedScores.length > 0 ? (
            <StatusChip kind="verified" label={`${verifiedScores.length} Verified`} />
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-mist text-moss border border-hairline">
              0 Verified Skills
            </span>
          )}

          <Link
            to={`/verify/${profile.credential_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2 ml-1"
          >
            <span>View public page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'education', label: 'Education', badge: proposals.length > 0 ? proposals.length : undefined },
          { id: 'sources', label: 'Connected sources', badge: sourceProposals.length > 0 ? sourceProposals.length : undefined },
          { id: 'visibility', label: 'Visibility' },
        ]}
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id as 'overview' | 'education' | 'sources' | 'visibility');
          setSearchParams({ tab: id });
        }}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Avatar Photo Section */}
          <div className="p-6 rounded-panel border border-hairline bg-canvas flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-hairline"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-verdant-100 text-verdant-800 flex items-center justify-center font-display font-bold text-2xl border-2 border-verdant-300">
                  {profile.full_name.charAt(0)}
                </div>
              )}

              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-ink/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-display font-semibold text-base text-ink">Profile photo</h3>
              <p className="text-xs text-moss">
                Client-side cropped to 512×512 square and re-encoded to JPEG (stripping EXIF metadata). Max 1 MB.
              </p>
              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-danger-600 hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-4">
            <Field label="Full name">
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </Field>

            <Field label="Headline (≤ 80 characters)">
              <Input
                maxLength={80}
                placeholder="e.g. Frontend Engineer focused on React & TypeScript performance"
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              />
            </Field>

            <Field label="Bio (≤ 500 characters)">
              <Textarea
                rows={3}
                maxLength={500}
                placeholder="Tell organizations about your background and interests…"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Location">
                <Input
                  placeholder="e.g. Bengaluru, India"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
              </Field>

              <Field label="Languages (comma separated)">
                <Input
                  placeholder="e.g. English, Hindi"
                  value={profile.languages.join(', ')}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      languages: e.target.value.split(',').map((l) => l.trim()).filter(Boolean),
                    })
                  }
                />
              </Field>
            </div>

            <div className="pt-2 border-t border-hairline space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-moss">Links</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="GitHub">
                  <Input
                    placeholder="https://github.com/username"
                    value={profile.links.github || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, github: e.target.value },
                      })
                    }
                  />
                </Field>
                <Field label="LinkedIn">
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={profile.links.linkedin || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        links: { ...profile.links, linkedin: e.target.value },
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {overviewSavedNotice && (
                <span className="text-xs text-verdant-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>Saved successfully</span>
                </span>
              )}
              <Button variant="primary" onClick={handleSaveOverview} className="ml-auto">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDUCATION & PROPOSALS */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          {/* Claim and merge proposals banner (8.1.2) */}
          {proposals.length > 0 && (
            <div className="p-6 rounded-panel border border-verdant-300 bg-verdant-50/70 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-verdant-700" />
                <h3 className="font-display font-semibold text-lg text-ink">
                  Confirm new university
                </h3>
              </div>

              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 rounded-control bg-canvas border border-verdant-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-ink">
                      {copy.university.confirmNewProposal(prop.university_name)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-moss">
                      <StatusChip kind="verified-university" />
                      <span>Level: {prop.program_level?.toUpperCase() ?? '—'}</span>
                      <span>Year: {prop.year}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConfirmProposal(prop.id)}
                    >
                      Confirm affiliation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Affiliation Timeline */}
          <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  Education timeline
                </h3>
                <p className="text-xs text-moss">
                  One permanent profile across university changes, graduation, or masters
                </p>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setIsAddUniOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add university</span>
              </Button>
            </div>

            <div className="space-y-4">
              {affiliations.map((aff) => (
                <div
                  key={aff.id}
                  className="p-4 rounded-control border border-hairline bg-mist/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink">
                        {aff.university_name}
                      </span>
                      {aff.is_verified ? (
                        <StatusChip kind="verified-university" />
                      ) : (
                        <StatusChip kind="unverified-university" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-moss">
                      <span className="capitalize">{aff.program_level ?? '—'}</span>
                      <span>·</span>
                      <span className="capitalize">{aff.status}</span>
                      {aff.year && <span>(Year {aff.year})</span>}
                      {aff.is_current && (
                        <span className="text-verdant-800 font-semibold">· Current</span>
                      )}
                    </div>
                    {!aff.is_verified && (
                      <p className="text-xs text-moss italic pt-1">
                        {copy.university.unverifiedNotice}
                      </p>
                    )}
                  </div>

                  <div className="text-xs text-moss text-right">
                    <span>{aff.started_at ? formatDate(aff.started_at) : 'Enrolled'}</span>
                    {aff.ended_at && <span> — {formatDate(aff.ended_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONNECTED SOURCES */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Connected data sources
              </h3>
              <p className="text-xs text-moss mt-0.5">
                Synced data can add to your profile and evidence. It never changes your verified scores.
              </p>
            </div>

            <div className="space-y-4">
            {displayedSources.map((source) => (                <div
                  key={source.id}
                  className="p-4 rounded-control border border-hairline bg-mist/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {source.source === 'github' && <Github className="w-4 h-4 text-ink" />}
                      {source.source === 'linkedin' && <Linkedin className="w-4 h-4 text-verdant-700" />}
                      {source.source === 'manual' && <LinkIcon className="w-4 h-4 text-moss" />}
                      <span className="font-semibold text-sm text-ink">{source.name}</span>
                      <StatusChip
                        kind={source.consent_granted ? 'verified' : 'declined'}
                        label={source.consent_granted ? 'Consent recorded' : 'Not connected'}
                      />
                    </div>
                    {source.last_synced_at && (
                      <p className="text-xs text-moss">
                        Last synced {formatDate(source.last_synced_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-moss">
                      {source.consent_granted ? 'Consent recorded' : 'Consent requested during authorization'}
                    </span>

                    {source.source === 'github' && (
                      <>
                        {source.consent_granted && source.id !== 'github-connect-card' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!user) return;
                              try {
                                const result = await backend.sources.syncSource(
                                  user.id,
                                  'github',
                                  { source_id: source.id }
                                );
                                if (result.proposals?.length) {
                                  toast.success('GitHub sync complete. Review the suggested profile updates.');
                                } else {
                                  toast.success('GitHub sync complete.');
                                }
                                await loadAll();
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'GitHub sync failed.');
                              }
                            }}
                          >
                            Sync
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            if (!user) return;
                            try {
                              await backend.sources.syncSource(user.id, 'github');
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'GitHub authorization could not start.');
                            }
                          }}
                        >
                          {source.consent_granted ? 'Authorize / reconnect' : 'Connect GitHub'}
                        </Button>

                        {source.consent_granted && source.id !== 'github-connect-card' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisconnectSourceId(source.id)}
                            className="text-xs text-danger-600 hover:bg-danger-50"
                          >
                            Disconnect
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Profile Updates (Proposals) */}
          {sourceProposals.length > 0 && (
            <div className="p-6 rounded-panel border border-verdant-300 bg-verdant-50/50 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-verdant-700" />
                <h3 className="font-display font-semibold text-base text-ink">
                  Suggested profile updates
                </h3>
              </div>
              <p className="text-xs text-moss leading-relaxed">
                We detected new skills and repos from your connected sources. Choose what to approve.
              </p>

              <div className="space-y-3">
                {sourceProposals.map((prop, pIdx) =>
                  prop.changes.map((change, cIdx) => (
                    <div
                      key={`${pIdx}-${cIdx}`}
                      className="p-3.5 rounded-control bg-canvas border border-verdant-200 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-ink">
                          {change.action === 'add' ? 'Add' : 'Update'} {change.field}:{' '}
                          <strong>{String(change.value)}</strong>
                        </span>
                        <p className="text-moss mt-0.5">{change.evidence}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            if (!user) return;
                            await backend.sources.applyProposal(user.id, pIdx);
                            await loadAll();
                            toast.success('Suggestion approved.');
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!user) return;
                            await backend.sources.dismissProposal(user.id, pIdx);
                            loadAll();
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VISIBILITY & PREVIEW */}
      {activeTab === 'visibility' && (
        <div className="space-y-6">
          <div className="p-6 rounded-panel border border-hairline bg-canvas space-y-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Public verification page
              </h3>
              <p className="text-xs text-moss mt-0.5">
                Control what appears when an employer scans your resume QR code or visits your public link.
              </p>
            </div>

            <div className="divide-y divide-hairline">
              <div className="py-3">
                <Switch
                  checked={profile.visibility.public_skills}
                  onChange={(v) => updateVisibilitySetting('public_skills', v)}
                  label="Show skills"
                  description="Display your verified skills list"
                />
              </div>

              <div className="py-3">
                <Switch
                  checked={profile.visibility.public_levels}
                  onChange={(v) => updateVisibilitySetting('public_levels', v)}
                  label="Show skill levels"
                  description="Display level badges (Competent, Proficient, Advanced)"
                />
              </div>

              <div className="py-3">
                <Switch
                  checked={profile.visibility.public_scores}
                  onChange={(v) => updateVisibilitySetting('public_scores', v)}
                  label="Show exact numeric scores"
                  description="Show numeric score (e.g. 72 / 100)"
                />
              </div>

              <div className="py-3">
                <Switch
                  checked={profile.visibility.public_name}
                  onChange={(v) => updateVisibilitySetting('public_name', v)}
                  label="Show my name"
                  description="Show your full name on the verification link"
                />
              </div>

              <div className="py-3">
                <Switch
                  checked={profile.visibility.public_university}
                  onChange={(v) => updateVisibilitySetting('public_university', v)}
                  label="Show university name"
                  description="Display your enrolled university"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-hairline space-y-2">
              <h4 className="font-display font-semibold text-base text-ink">Discovery mode</h4>
              <Switch
                checked={profile.visibility.discovery_opt_in}
                onChange={(v) => updateVisibilitySetting('discovery_opt_in', v)}
                label="Let organizations find my skills"
                description="Organizations discover your verified skill profile without seeing your name. Identity is revealed only after you accept their request."
              />
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="p-6 rounded-panel border border-hairline bg-mesh space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-moss">
                Public page preview
              </h4>
              <Link
                to={`/verify/${profile.credential_id}`}
                className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1 underline underline-offset-2"
              >
                <span>Open live certificate</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-6 rounded-panel bg-canvas border border-hairline space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">
                    {profile.visibility.public_name ? profile.full_name : 'Verified Student'}
                  </h3>
                  <p className="text-xs text-moss">{profile.headline || 'Software Developer'}</p>
                </div>

                {verifiedScores.length > 0 ? (
                  <StatusChip kind="verified" label="AptoHire Verified" />
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-mist text-moss border border-hairline">
                    Candidate in progress
                  </span>
                )}
              </div>

              {profile.visibility.public_university && affiliations[0] && (
                <p className="text-xs text-moss font-medium">
                  {affiliations[0].university_name}
                </p>
              )}

              {/* Verified Skills vs. Empty State */}
              {verifiedScores.length > 0 && profile.visibility.public_skills ? (
                <div className="pt-2 border-t border-hairline space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-moss block">
                    Verified Competencies ({verifiedScores.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {verifiedScores.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-verdant-100 text-verdant-800"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5] text-verdant-700" />
                        <span>{s.skill_name}</span>
                        {profile.visibility.public_levels && (
                          <span className="font-medium text-verdant-700">· {s.level}</span>
                        )}
                        {profile.visibility.public_scores && (
                          <span className="font-mono text-[11px] font-bold text-verdant-900">· {s.score}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : verifiedScores.length === 0 ? (
                <div className="pt-2 border-t border-hairline py-1">
                  <p className="text-xs text-moss italic">
                    No verified skills scored above pass mark yet. Submit project deliverables to earn verified scores on your public card.
                  </p>
                </div>
              ) : null}

              {/* Target Skills (Unverified Learning Goals) */}
              {profile.target_skills.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-moss">Learning targets:</span>
                  {profile.target_skills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-mist/80 text-ink border border-hairline"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD UNIVERSITY DIALOG */}
      <Dialog open={isAddUniOpen} onOpenChange={setIsAddUniOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a new university</DialogTitle>
            <DialogDescription>
              Add a current or past university affiliation to your verified education timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-ink flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uniType"
                  checked={addUniType === 'registered'}
                  onChange={() => setAddUniType('registered')}
                />
                <span>Registered university</span>
              </label>
              <label className="text-xs font-medium text-ink flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uniType"
                  checked={addUniType === 'unregistered'}
                  onChange={() => setAddUniType('unregistered')}
                />
                <span>Unregistered university</span>
              </label>
            </div>

            {addUniType === 'registered' ? (
              <>
                <Field label="Choose university">
                  <Select
                    value={selectedUniId}
                    onChange={(e) => setSelectedUniId(e.target.value)}
                  >
                    <option value="">Select university…</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Student ID number (optional)">
                  <Input
                    placeholder="e.g. B-1042"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <Field label="University name">
                <Input
                  placeholder="Enter institution name"
                  value={unregisteredUniName}
                  onChange={(e) => setUnregisteredUniName(e.target.value)}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Program level">
                <Select
                  value={programLevel}
                  onChange={(e) => setProgramLevel(e.target.value as 'ug' | 'pg')}
                >
                  <option value="ug">Undergraduate</option>
                  <option value="pg">Postgraduate</option>
                </Select>
              </Field>

              <Field label="Status">
                <Select
                  value={uniStatus}
                  onChange={(e) =>
                    setUniStatus(
                      e.target.value as 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters'
                    )
                  }
                >
                  <option value="enrolled">Enrolled</option>
                  <option value="alumni">Alumni</option>
                  <option value="masters">Masters</option>
                  <option value="dropout">Dropout</option>
                </Select>
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddUniOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddAffiliation}
              disabled={addUniType === 'registered' ? !selectedUniId : !unregisteredUniName.trim()}
            >
              Add affiliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DISCONNECT SOURCE DIALOG */}
      <Dialog open={!!disconnectSourceId} onOpenChange={(open) => !open && setDisconnectSourceId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect data source?</DialogTitle>
            <DialogDescription>
              We will stop synchronizing projects and skills from this account.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={deleteDerivedData}
                onChange={(e) => setDeleteDerivedData(e.target.checked)}
              />
              <span>Also delete data we derived from this source</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisconnectSourceId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!user || !disconnectSourceId) return;
                await backend.sources.disconnectSource(user.id, disconnectSourceId, deleteDerivedData);
                setDisconnectSourceId(null);
                loadAll();
                toast.success('Source disconnected.');
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ProfilePage;
