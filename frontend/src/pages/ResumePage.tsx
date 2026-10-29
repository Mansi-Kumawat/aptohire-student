import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { StudentProfile, Affiliation, SkillScore } from '@/lib/domain/types';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/common/BackButton';
import { rootUrl } from '@/config/links';
import { Helmet } from 'react-helmet-async';
import { FileDown, Printer } from 'lucide-react';
import QRCode from 'qrcode';

export const ResumePage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [scores, setScores] = useState<SkillScore[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [prof, affs, scs] = await Promise.all([
          backend.student.getProfile(user.id),
          backend.affiliations.listAffiliations(user.id),
          backend.scores.listSkillScores(user.id),
        ]);
        setProfile(prof);
        setAffiliations(affs);
        // Exclude borderline / under-review scores
        setScores(scs.filter((s) => s.is_verified && !s.is_borderline));

        // Generate QR Code data URL
        const verifyLink = rootUrl(`/verify/${prof.credential_id}`);
        const dataUrl = await QRCode.toDataURL(verifyLink, {
          margin: 1,
          width: 140,
          color: {
            dark: '#17261E',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [backend, user]);

  const handleDownloadPdf = async () => {
    if (!profile) return;
    setIsGeneratingPdf(true);

    try {
      // Dynamic import of @react-pdf/renderer on click only as required by Section 3 & 8.9
      const { pdf, Document, Page, Text, View, StyleSheet, Image } = await import(
        '@react-pdf/renderer'
      );

      const styles = StyleSheet.create({
        page: {
          padding: 36,
          backgroundColor: '#FFFFFF',
          fontFamily: 'Helvetica',
          fontSize: 10,
          color: '#17261E',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#E3E8E5',
          paddingBottom: 16,
          marginBottom: 16,
        },
        name: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#17261E',
          marginBottom: 4,
        },
        headline: {
          fontSize: 11,
          color: '#5B6A62',
          marginBottom: 6,
        },
        credentialBadge: {
          fontSize: 9,
          fontFamily: 'Courier',
          color: '#0B7F49',
          backgroundColor: '#ECFAF2',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          alignSelf: 'flex-start',
        },
        qrSection: {
          alignItems: 'center',
          width: 90,
        },
        qrImage: {
          width: 70,
          height: 70,
        },
        qrLabel: {
          fontSize: 7,
          color: '#5B6A62',
          marginTop: 4,
          textAlign: 'center',
        },
        section: {
          marginBottom: 14,
        },
        sectionTitle: {
          fontSize: 12,
          fontWeight: 'bold',
          color: '#17261E',
          borderBottomWidth: 1,
          borderBottomColor: '#E3E8E5',
          paddingBottom: 4,
          marginBottom: 8,
        },
        skillGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        skillPill: {
          backgroundColor: '#ECFAF2',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          fontSize: 9,
          color: '#0A6139',
          borderWidth: 1,
          borderColor: '#D2F3E1',
          marginBottom: 4,
          marginRight: 6,
        },
        timelineItem: {
          marginBottom: 8,
        },
        timelineTitle: {
          fontWeight: 'bold',
          fontSize: 10,
        },
        timelineSub: {
          fontSize: 9,
          color: '#5B6A62',
        },
        bio: {
          lineHeight: 1.5,
          color: '#17261E',
        },
      });

      const currentAff = affiliations.find((a) => a.is_current) || affiliations[0];

      const ResumeDoc = (
        <Document title={`AptoHire-Resume-${profile.full_name}`}>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.name}>{profile.full_name}</Text>
                <Text style={styles.headline}>
                  {profile.headline || 'Verified Competency Profile'}
                </Text>
                <Text style={styles.credentialBadge}>
                  AptoHire Credential: {profile.credential_id}
                </Text>
              </View>

              {qrCodeDataUrl && (
                <View style={styles.qrSection}>
                  <Image src={qrCodeDataUrl} style={styles.qrImage} />
                  <Text style={styles.qrLabel}>Scan to verify evidence</Text>
                </View>
              )}
            </View>

            {/* Education */}
            {currentAff && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education & Affiliation</Text>
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineTitle}>{currentAff.university_name}</Text>
                  <Text style={styles.timelineSub}>
                    {currentAff.program_level?.toUpperCase() ?? '—'} · Status: {currentAff.status}{' '}
                    {currentAff.year ? `(Year ${currentAff.year})` : ''} ·{' '}
                    {currentAff.is_verified ? 'Verified University' : 'Unregistered Institution'}
                  </Text>
                </View>
              </View>
            )}

            {/* Verified Skills */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verified Skills & Competencies</Text>
              <View style={styles.skillGrid}>
                {scores.map((s) => (
                  <Text key={s.id} style={styles.skillPill}>
                    {s.skill_name} — {s.level}
                    {profile.visibility.public_scores ? ` (${s.score}/100)` : ''}
                  </Text>
                ))}
              </View>
            </View>

            {/* Bio */}
            {profile.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={{ marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E3E8E5' }}>
              <Text style={{ fontSize: 8, color: '#5B6A62', textAlign: 'center' }}>
                Verified via AptoHire Proof Engine · All scores backed by reviewed code and demo video evidence.
              </Text>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(ResumeDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AptoHire-Resume-${profile.full_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !profile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentAff = affiliations.find((a) => a.is_current) || affiliations[0];
  const verifyLink = rootUrl(`/verify/${profile.credential_id}`);

  return (
    <div className="max-w-3xl mx-auto space-y-6 antialiased pb-16">
      <Helmet>
        <title>Digital Resume · {profile.full_name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Action Toolbar (Hidden in Print) */}
      <div className="no-print">
        <BackButton to="/scorecard" label="Back to scorecard" className="mb-3" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-hairline pb-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            Digital resume
          </h1>
          <p className="text-moss text-[15px] mt-0.5">
            Verified proof resume with verifiable QR code to public audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="default" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print</span>
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={handleDownloadPdf}
            isLoading={isGeneratingPdf}
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            <span>{isGeneratingPdf ? 'Preparing your resume…' : 'Download PDF'}</span>
          </Button>
        </div>
      </div>

      {/* WEB VIEW OF RESUME (Printable) */}
      <article
        id="resume-document"
        className="p-8 sm:p-12 rounded-panel border border-hairline bg-canvas shadow-float space-y-8"
      >
        {/* Header with Name & QR */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-hairline pb-8">
          <div className="space-y-2 flex-1">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
              {profile.full_name}
            </h2>
            <p className="text-lg text-moss leading-normal">
              {profile.headline || 'Software Developer'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded-control bg-verdant-50 text-verdant-800 border border-verdant-200">
                AptoHire ID: {profile.credential_id}
              </span>
              <span className="text-xs text-moss">{profile.location}</span>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeDataUrl && (
            <div className="flex flex-col items-center text-center p-3 rounded-control bg-mist/60 border border-hairline shrink-0">
              <img
                src={qrCodeDataUrl}
                alt="Verification QR Code"
                className="w-24 h-24 object-contain rounded"
              />
              <span className="text-[10px] text-moss mt-1 font-mono">Scan to verify</span>
            </div>
          )}
        </div>

        {/* Education & Affiliation */}
        {currentAff && (
          <section className="space-y-3">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-hairline pb-1">
              Education & Affiliation
            </h3>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base text-ink">
                  {currentAff.university_name}
                </h4>
                <p className="text-sm text-moss">
                  {currentAff.program_level?.toUpperCase() ?? '—'} · {currentAff.status}{' '}
                  {currentAff.year ? `(Year ${currentAff.year})` : ''}
                </p>
              </div>
              <StatusChip
                kind={currentAff.is_verified ? 'verified-university' : 'unverified-university'}
              />
            </div>
          </section>
        )}

        {/* Verified Skills */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-hairline pb-1">
            <h3 className="font-display font-semibold text-lg text-ink">
              Verified Skills
            </h3>
            <span className="text-xs text-moss">
              Rubric-scored & backed by real code/video
            </span>
          </div>

          {scores.length === 0 ? (
            <p className="text-sm text-moss italic">No verified skills scored above pass mark yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {scores.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3.5 rounded-control border border-hairline bg-mist/30 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-ink">{skill.skill_name}</span>
                    <p className="text-xs text-moss">{skill.family}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip kind="verified" label={skill.level} />
                    {profile.visibility.public_scores && (
                      <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                        {skill.score}/100
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bio */}
        {profile.bio && (
          <section className="space-y-2">
            <h3 className="font-display font-semibold text-lg text-ink border-b border-hairline pb-1">
              About
            </h3>
            <p className="text-[15px] text-ink/90 leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Links */}
        <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs text-moss">
          <span>Public verification URL: <Link to={`/verify/${profile.credential_id}`} className="underline text-verdant-700 font-mono font-medium">{verifyLink}</Link></span>
          <span>Verified on AptoHire</span>
        </div>
      </article>
    </div>
  );
};
export default ResumePage;
