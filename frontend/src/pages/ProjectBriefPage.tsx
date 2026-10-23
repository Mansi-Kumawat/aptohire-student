import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjectBrief, useProjects } from '@/features/projects/useProjects';
import { StatusChip } from '@/components/proof/StatusChip';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/common/BackButton';
import { Helmet } from 'react-helmet-async';
import { Clock, Play, RotateCcw, Video, HelpCircle, Layers } from 'lucide-react';

export const ProjectBriefPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { data: assignment, isLoading } = useProjectBrief(assignmentId || '');
  const { updateAssignmentStatus } = useProjects();

  // Deliverables checklist stored per assignment in localStorage
  const [checkedDeliverables, setCheckedDeliverables] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (assignmentId) {
      try {
        const stored = localStorage.getItem(`deliverables_${assignmentId}`);
        if (stored) {
          setCheckedDeliverables(JSON.parse(stored));
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [assignmentId]);

  const toggleDeliverable = (index: number) => {
    const updated = { ...checkedDeliverables, [index]: !checkedDeliverables[index] };
    setCheckedDeliverables(updated);
    if (assignmentId) {
      try {
        localStorage.setItem(`deliverables_${assignmentId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleStartProject = async () => {
    if (assignmentId) {
      try {
        await updateAssignmentStatus({ assignmentId, status: 'in_progress' });
      } catch {
        // ignore
      }
      navigate(`/submissions/new?assignment=${assignmentId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-bold font-display text-ink">Project brief not found</h2>
        <p className="text-moss text-sm">This assignment may have been removed or completed.</p>
        <Link to="/projects">
          <Button variant="primary">Return to projects</Button>
        </Link>
      </div>
    );
  }

  const { brief } = assignment;
  const totalDeliverables = brief.deliverables.length;
  const completedDeliverables = Object.values(checkedDeliverables).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 antialiased pb-12">
      <Helmet>
        <title>{brief.title} · AptoHire Project Brief</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div>
        <BackButton to="/projects" label="Back to projects" className="mb-4" />
      </div>

      {/* Hero brief header */}
      <div className="border-b border-hairline pb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip
            kind={
              brief.level === 'Advanced'
                ? 'advanced'
                : brief.level === 'Proficient'
                ? 'proficient'
                : 'competent'
            }
            label={brief.level}
          />
          <div className="flex items-center gap-1.5 text-xs text-moss font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>About {brief.estimated_hours} hours</span>
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
          {brief.title}
        </h1>

        <div className="flex flex-wrap gap-2 pt-1">
          {brief.target_skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-mist text-ink border border-hairline"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Scenario & Context */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-ink">The Scenario</h2>
        <p className="text-[16px] text-ink/90 leading-relaxed bg-mist/40 p-5 rounded-panel border border-hairline">
          {brief.scenario}
        </p>
      </section>

      {/* Deliverables Checklist */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-ink">
            Deliverables Checklist
          </h2>
          <span className="text-xs font-mono font-medium text-moss">
            {completedDeliverables} of {totalDeliverables} complete
          </span>
        </div>

        <div className="border border-hairline rounded-panel divide-y divide-hairline bg-canvas">
          {brief.deliverables.map((item, idx) => {
            const isChecked = !!checkedDeliverables[idx];
            return (
              <div
                key={idx}
                className={`p-4 transition-colors ${isChecked ? 'bg-verdant-50/30' : ''}`}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleDeliverable(idx)}
                  label={
                    <span className={isChecked ? 'line-through text-moss' : 'text-ink'}>
                      {item}
                    </span>
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Constraints & Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-5 border border-hairline rounded-panel bg-canvas space-y-3">
          <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-moss" />
            <span>Constraints</span>
          </h3>
          <ul className="space-y-2 text-sm text-moss list-disc list-inside leading-relaxed">
            {brief.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>

        {brief.suggested_stack && (
          <section className="p-5 border border-hairline rounded-panel bg-canvas space-y-3">
            <h3 className="font-display font-semibold text-base text-ink">
              Suggested Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {brief.suggested_stack.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-control text-xs font-medium bg-mist border border-hairline text-ink"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-xs text-moss mt-2">
              You may substitute equivalent modern libraries as long as you meet the rubric.
            </p>
          </section>
        )}
      </div>

      {/* Rubric Preview */}
      <section className="space-y-3">
        <h2 className="font-display font-semibold text-lg text-ink">Rubric Preview</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Criterion</TableHead>
              <TableHead className="w-44 text-right">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brief.rubric_preview.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-ink">{r.criterion}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-24 h-2 rounded-full bg-mist overflow-hidden">
                      <div
                        className="h-full bg-verdant-600 rounded-full"
                        style={{ width: `${r.weight * 3.5}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {r.weight}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Video Guidance */}
      <section className="p-5 border border-hairline rounded-panel bg-verdant-50/40 space-y-2">
        <div className="flex items-center gap-2 text-verdant-800 font-semibold text-sm">
          <Video className="w-4 h-4" />
          <span>What to show in your 3-minute demo video</span>
        </div>
        <p className="text-sm text-ink/80 leading-relaxed">
          {brief.video_guidance}
        </p>
      </section>

      {/* Originality Questions Preview */}
      <section className="p-5 border border-hairline rounded-panel bg-canvas space-y-3">
        <div className="flex items-center gap-2 text-ink font-semibold text-sm">
          <HelpCircle className="w-4 h-4 text-moss" />
          <span>Originality Questions (Answer in video or submission form)</span>
        </div>
        <ul className="space-y-2 text-sm text-moss list-decimal list-inside leading-relaxed">
          {brief.originality_questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      {/* Sticky Bottom Actions */}
      <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/projects/new">
          <Button variant="ghost" size="default" className="text-moss">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Get a different project</span>
          </Button>
        </Link>

        <Button variant="primary" size="lg" onClick={handleStartProject} className="w-full sm:w-auto">
          <Play className="w-4 h-4 mr-2 fill-current" />
          <span>Start project & open submission</span>
        </Button>
      </div>
    </div>
  );
};
export default ProjectBriefPage;
