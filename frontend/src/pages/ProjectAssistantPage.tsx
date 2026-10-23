import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useBackend } from '@/lib/backend';
import { useAuth } from '@/features/auth/useAuth';
import { SkillItem, SkillScore } from '@/lib/domain/types';
import { SkillLevel } from '@/lib/scoring';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/common/BackButton';
import { Helmet } from 'react-helmet-async';
import { Sparkles, ArrowRight, Upload, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { copy } from '@/content/copy';

const TARGET_LEVELS: {
  level: SkillLevel;
  scoreRange: string;
  badge: string;
  description: string;
}[] = [
  {
    level: 'Competent',
    scoreRange: 'Score 51–69',
    badge: 'Core Practitioner',
    description: 'Clean syntax mastery, standard workflows, and functional project components.',
  },
  {
    level: 'Proficient',
    scoreRange: 'Score 70–84',
    badge: 'Industry Ready',
    description: 'Robust architecture, automated testing, optimization, and edge case resilience.',
  },
  {
    level: 'Advanced',
    scoreRange: 'Score 85–100',
    badge: 'Senior Benchmark',
    description: 'Production-grade security, fault tolerance, scalability, and technical leadership.',
  },
];

export const ProjectAssistantPage: React.FC = () => {
  const backend = useBackend();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSkill = searchParams.get('skill') || '';

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [studentScores, setStudentScores] = useState<SkillScore[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill);
  const [customRole, setCustomRole] = useState<string>('');
  const [targetLevel, setTargetLevel] = useState<SkillLevel>('Competent');
  const [levelRecommendation, setLevelRecommendation] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorObj, setErrorObj] = useState<{ code?: string; message: string } | null>(null);

  useEffect(() => {
    backend.skills.listSkills().then(setSkills);
    if (user) {
      backend.scores.listSkillScores(user.id).then((scores) => {
        setStudentScores(scores);
      });
    }
  }, [backend, user]);

  // Adjust recommended level based on current score
  useEffect(() => {
    if (!selectedSkill) {
      setTargetLevel('Competent');
      setLevelRecommendation('');
      return;
    }

    const currentScore = studentScores.find(
      (s) =>
        s.skill_slug.toLowerCase() === selectedSkill.toLowerCase() ||
        s.skill_name.toLowerCase() === selectedSkill.toLowerCase()
    );

    if (currentScore) {
      if (currentScore.level === 'Competent') {
        setTargetLevel('Proficient');
        setLevelRecommendation(
          `We'll aim for Proficient, one step above your current Competent in ${currentScore.skill_name}.`
        );
      } else if (currentScore.level === 'Proficient') {
        setTargetLevel('Advanced');
        setLevelRecommendation(
          `We'll aim for Advanced, one step above your current Proficient in ${currentScore.skill_name}.`
        );
      } else {
        setTargetLevel('Advanced');
        setLevelRecommendation(`You're already Advanced in ${currentScore.skill_name}!`);
      }
    } else {
      setTargetLevel('Competent');
      setLevelRecommendation(`Starting fresh with ${selectedSkill}. We'll aim for Competent.`);
    }
  }, [selectedSkill, studentScores]);

  const handleGetProject = async () => {
    if (!user) return;
    setIsGenerating(true);
    setErrorObj(null);

    const timer = setTimeout(() => {
      setIsGenerating(false);
      setErrorObj({
        code: 'TIMEOUT',
        message: 'Generation timed out. Please try again.',
      });
    }, 20000);

    try {
      const res = await backend.projects.assignProject({
        student_id: user.id,
        target: {
          skill_slug: selectedSkill || undefined,
          role_text: customRole || undefined,
        },
        level: targetLevel === 'Emerging' ? 'Competent' : targetLevel,
      });

      clearTimeout(timer);
      navigate(`/projects/${res.assignment_id}`, { replace: true });
    } catch (err: unknown) {
      clearTimeout(timer);
      setIsGenerating(false);
      const e = err as { code?: string; message?: string };
      const code = e?.code || 'UNKNOWN';
      const message = e?.message || copy.errors.GENERIC;
      setErrorObj({ code, message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 antialiased py-4 pb-12">
      <Helmet>
        <title>Project Assistant · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton to="/projects" label="Back to projects" className="mb-4" />
        <div className="flex items-center gap-2 text-verdant-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Project Assistant</span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          What do you want to get hired for?
        </h1>
        <p className="text-moss text-[15px] mt-1">
          Choose a target skill or role to receive a tailored project brief
        </p>
      </div>

      {isGenerating ? (
        <div className="p-8 border border-hairline rounded-panel bg-canvas space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-verdant-100 flex items-center justify-center text-verdant-700 mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-lg text-ink">
            Building a project at your level…
          </h3>
          <p className="text-xs text-moss max-w-sm mx-auto">
            Configuring scenario requirements, originality prompts, and rubric preview for {selectedSkill || customRole || 'Web/Frontend'}.
          </p>
          <div className="space-y-2 max-w-md mx-auto pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="border border-hairline rounded-panel bg-canvas p-6 space-y-6">
          {errorObj && (
            <div className="p-4 rounded-control bg-ember-50 border border-ember-300 text-ember-700 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-ember-700 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorObj.message}</p>
                  {errorObj.code === 'NO_TEMPLATE' && (
                    <div className="mt-3">
                      <Link to="/submissions/new?own=1">
                        <Button variant="secondary" size="sm">
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          <span>Upload my own project</span>
                        </Button>
                      </Link>
                    </div>
                  )}
                  {errorObj.code === 'TIMEOUT' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleGetProject}
                      className="mt-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Retry</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Skill selector */}
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-ink block">
              Choose a target skill:
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const isSelected = selectedSkill === skill.name;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(skill.name);
                      setCustomRole('');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] border ${
                      isSelected
                        ? 'bg-verdant-700 text-white border-verdant-700 shadow-sm'
                        : 'bg-canvas text-ink border-hairline hover:border-moss'
                    }`}
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-hairline"></div>
            <span className="flex-shrink mx-4 text-xs text-moss uppercase tracking-wider">
              Or target a role
            </span>
            <div className="flex-grow border-t border-hairline"></div>
          </div>

          <Field
            label="Target role"
            helperText="e.g. Frontend Developer, UI Engineer, Full Stack Intern"
          >
            <Input
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value);
                if (e.target.value) setSelectedSkill('');
              }}
              placeholder="Frontend Developer"
            />
          </Field>

          {/* Level Selector with Recommendation */}
          <div className="space-y-3 pt-2 border-t border-hairline">
            <div>
              <label className="text-[14px] font-semibold text-ink block">
                Target competency level
              </label>
              <p className="text-xs text-moss mt-0.5">
                {levelRecommendation || 'Aim for a skill level to match your career goals.'}
              </p>
            </div>

            {/* Visual Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TARGET_LEVELS.map((tl) => {
                const isSelected = targetLevel === tl.level;
                return (
                  <button
                    key={tl.level}
                    type="button"
                    onClick={() => setTargetLevel(tl.level)}
                    className={`relative p-3.5 rounded-panel text-left transition-all border ${
                      isSelected
                        ? 'border-verdant-700 bg-verdant-50/70 shadow-sm ring-1 ring-verdant-700/20'
                        : 'border-hairline bg-canvas hover:border-moss/50 hover:bg-mist/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-display font-bold text-sm text-ink">
                        {tl.level}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-verdant-700 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-hairline shrink-0" />
                      )}
                    </div>
                    <div className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-canvas border border-hairline text-moss mb-1.5">
                      {tl.scoreRange}
                    </div>
                    <p className="text-[12px] text-moss leading-relaxed line-clamp-2">
                      {tl.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Accessible Select Fallback / Alternative */}
            <div className="pt-1">
              <label htmlFor="target-level-select" className="text-xs text-moss font-medium sr-only">
                Or select level from dropdown
              </label>
              <Select
                id="target-level-select"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as SkillLevel)}
              >
                <option value="Competent">Competent (Score 51–69 · Core Practitioner)</option>
                <option value="Proficient">Proficient (Score 70–84 · Industry Ready)</option>
                <option value="Advanced">Advanced (Score 85–100 · Senior Benchmark)</option>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link to="/projects">
              <Button variant="ghost">Cancel</Button>
            </Link>

            <Button
              variant="accent"
              size="lg"
              onClick={handleGetProject}
              disabled={!selectedSkill && !customRole}
            >
              <span>Get project</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectAssistantPage;
