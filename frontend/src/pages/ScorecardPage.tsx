import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { SkillScore, SkillItem, SkillEdge, PublicConfig } from '@/lib/domain/types';
import { ProofRing } from '@/components/proof/ProofRing';
import { StatusChip } from '@/components/proof/StatusChip';
import { SkillGraph } from '@/components/proof/SkillGraph';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import { Award, FileDown, Plus, ArrowRight } from 'lucide-react';

export const ScorecardPage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scores, setScores] = useState<SkillScore[]>([]);
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [skillEdges, setSkillEdges] = useState<SkillEdge[]>([]);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [scs, sks, edges, cfg] = await Promise.all([
          user ? backend.scores.listSkillScores(user.id) : [],
          backend.skills.listSkills(),
          backend.skills.listSkillEdges(),
          backend.config.getPublicConfig(),
        ]);
        setScores(scs);
        setAllSkills(sks);
        setSkillEdges(edges);
        setConfig(cfg);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [backend, user]);

  // Group verified/assessed skills by family
  const families = ['Web/Frontend', 'Backend', 'Data', 'Management/Commerce'] as const;

  return (
    <div className="space-y-8 antialiased pb-16">
      <Helmet>
        <title>Scorecard · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            Verified scorecard
          </h1>
          <p className="text-moss text-[15px] mt-1">
            Rubric-scored skills linked to project evidence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/resume">
            <Button variant="secondary" size="default">
              <FileDown className="w-4 h-4 mr-1.5" />
              <span>Download resume</span>
            </Button>
          </Link>

          <Link to="/projects/new">
            <Button variant="accent" size="default">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Get a project</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : scores.length === 0 ? (
        <EmptyState
          icon={<Award className="w-8 h-8 text-verdant-700" />}
          title="No scores yet"
          description="Complete and submit a project to earn your first verified skill scores."
          actionLabel="Get a project"
          actionVariant="accent"
          onAction={() => navigate('/projects/new')}
        />
      ) : (
        <>
          {/* Living Skill Graph Component (List / Graph toggle) */}
          <SkillGraph
            skills={allSkills}
            edges={skillEdges}
            scores={scores}
            onSelectSkill={(skill) => navigate(`/scorecard/${skill.slug}`)}
          />

          {/* Grouped Skills by Family */}
          <div className="space-y-6">
            {families.map((family) => {
              const familyScores = scores.filter((s) => s.family === family);
              if (familyScores.length === 0) return null;

              return (
                <div key={family} className="space-y-3">
                  <h2 className="font-display font-semibold text-lg text-ink border-b border-hairline pb-2">
                    {family}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familyScores.map((score) => {
                      const ringState = score.is_borderline
                        ? 'under-review'
                        : score.is_verified
                        ? 'verified'
                        : 'not-verified';

                      return (
                        <Link
                          key={score.id}
                          to={`/scorecard/${score.skill_slug}`}
                          className="p-5 rounded-panel border border-hairline bg-canvas hover:border-verdant-600 transition-all flex items-center justify-between group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <ProofRing
                              score={score.score}
                              skill={score.skill_name}
                              state={ringState}
                              size={96}
                              animate={false}
                              showCaption={false}
                              passMark={config?.pass_mark}
                            />

                            <div className="space-y-1">
                              <h3 className="font-display font-semibold text-base text-ink group-hover:text-verdant-800 transition-colors">
                                {score.skill_name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <StatusChip
                                  kind={
                                    score.is_verified
                                      ? (score.level.toLowerCase() as 'emerging' | 'competent' | 'proficient' | 'advanced')
                                      : 'under-review'
                                  }
                                  label={score.level}
                                />
                                {score.is_borderline && (
                                  <StatusChip kind="under-review" label="Under review" />
                                )}
                              </div>
                              <p className="text-xs text-moss">
                                Last reviewed: {formatDate(score.last_reviewed_at)}
                              </p>
                            </div>
                          </div>

                          <ArrowRight className="w-5 h-5 text-moss group-hover:text-verdant-700 group-hover:translate-x-1 transition-all" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
export default ScorecardPage;
