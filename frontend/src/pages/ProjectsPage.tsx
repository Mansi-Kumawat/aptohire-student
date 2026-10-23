import React, { useState } from 'react';
import { useProjects } from '@/features/projects/useProjects';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { StatusChip, StatusChipKind } from '@/components/proof/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { formatDate } from '@/lib/format';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FolderKanban, Plus, Upload, ArrowRight, RotateCw } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { assignments, submissions, isLoading } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scored'>('all');

  // Unified project item model merging assignments and submissions
  interface UnifiedProject {
    id: string;
    title: string;
    targetSkill: string;
    status:
      | 'assigned'
      | 'in_progress'
      | 'submitted'
      | 'auditing'
      | 'scored'
      | 'needs_review'
      | 'appealed'
      | 'failed';
    updatedAt: string;
    assignmentId?: string;
    submissionId?: string;
  }

  const projectMap = new Map<string, UnifiedProject>();

  // Add assignments
  assignments.forEach((asg) => {
    projectMap.set(asg.id, {
      id: asg.id,
      title: asg.brief.title,
      targetSkill: asg.target_skill || asg.brief.target_skills[0] || 'General',
      status: asg.status === 'in_progress' ? 'in_progress' : 'assigned',
      updatedAt: asg.created_at,
      assignmentId: asg.id,
    });
  });

  // Overlay submissions
  submissions.forEach((sub) => {
    const key = sub.assignment_id || sub.id;
    const existing = projectMap.get(key);

    let status: UnifiedProject['status'] = 'in_progress';
    if (sub.status === 'draft') status = 'in_progress';
    else if (sub.status === 'submitted') status = 'submitted';
    else if (sub.status === 'auditing') status = 'auditing';
    else if (sub.status === 'scored') status = 'scored';
    else if (sub.status === 'needs_review') status = 'needs_review';
    else if (sub.status === 'appealed') status = 'appealed';
    else if (sub.status === 'failed') status = 'failed';

    projectMap.set(key, {
      id: sub.id,
      title: sub.title || existing?.title || 'Untitled Project',
      targetSkill: sub.skills_claimed[0] || existing?.targetSkill || 'General',
      status,
      updatedAt: sub.updated_at || sub.created_at,
      assignmentId: sub.assignment_id || undefined,
      submissionId: sub.id,
    });
  });

  const allProjects = Array.from(projectMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const filteredProjects = allProjects.filter((p) => {
    if (activeTab === 'active') {
      return ['assigned', 'in_progress', 'submitted', 'auditing', 'failed'].includes(p.status);
    }
    if (activeTab === 'scored') {
      return ['scored', 'needs_review', 'appealed'].includes(p.status);
    }
    return true;
  });

  const getStatusChipProps = (status: UnifiedProject['status']): { kind: StatusChipKind; label: string } => {
    switch (status) {
      case 'assigned':
        return { kind: 'pending', label: 'Assigned' };
      case 'in_progress':
        return { kind: 'under-review', label: 'In progress' };
      case 'submitted':
        return { kind: 'pending', label: 'Submitted' };
      case 'auditing':
        return { kind: 'auditing', label: 'Auditing' };
      case 'scored':
        return { kind: 'verified', label: 'Scored' };
      case 'needs_review':
        return { kind: 'under-review', label: 'Needs review' };
      case 'appealed':
        return { kind: 'pending', label: 'Appealed' };
      case 'failed':
        return { kind: 'declined', label: 'Review failed · Retry' };
      default:
        return { kind: 'pending', label: status };
    }
  };

  const getActionLink = (project: UnifiedProject) => {
    if (project.status === 'assigned') {
      return `/projects/${project.assignmentId}`;
    }
    if (project.status === 'in_progress') {
      return project.submissionId
        ? `/submissions/${project.submissionId}/edit`
        : `/submissions/new?assignment=${project.assignmentId}`;
    }
    if (project.submissionId) {
      return `/submissions/${project.submissionId}`;
    }
    return `/projects/${project.assignmentId}`;
  };

  return (
    <div className="space-y-6 antialiased">
      <Helmet>
        <title>Projects · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
            My projects
          </h1>
          <p className="text-moss text-[15px] mt-1">
            Build and submit real projects to earn verified skills
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="default"
            onClick={() => navigate('/submissions/new?own=1')}
            className="text-xs sm:text-sm"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Upload my own project</span>
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={() => navigate('/projects/new')}
            className="text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Get a project</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Tabs
        items={[
          { id: 'all', label: 'All projects', badge: allProjects.length },
          {
            id: 'active',
            label: 'Active',
            badge: allProjects.filter((p) =>
              ['assigned', 'in_progress', 'submitted', 'auditing', 'failed'].includes(p.status)
            ).length,
          },
          {
            id: 'scored',
            label: 'Scored',
            badge: allProjects.filter((p) =>
              ['scored', 'needs_review', 'appealed'].includes(p.status)
            ).length,
          },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'all' | 'active' | 'scored')}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-7 h-7 text-verdant-700" />}
          title="No projects yet"
          description="Pick a skill and get your first project to start building your verified credential."
          actionLabel="Get a project"
          actionVariant="accent"
          onAction={() => navigate('/projects/new')}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Target Skill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const chip = getStatusChipProps(project.status);
                  const link = getActionLink(project);

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-semibold text-ink max-w-xs truncate">
                        <Link to={link} className="hover:text-verdant-700 transition-colors">
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-moss font-medium">
                        {project.targetSkill}
                      </TableCell>
                      <TableCell>
                        <StatusChip kind={chip.kind} label={chip.label} />
                      </TableCell>
                      <TableCell className="text-moss text-xs">
                        {formatDate(project.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={link}>
                          <Button variant="ghost" size="sm" className="h-[32px] text-xs">
                            {project.status === 'failed' ? (
                              <>
                                <RotateCw className="w-3.5 h-3.5 mr-1" />
                                <span>Retry</span>
                              </>
                            ) : (
                              <>
                                <span>View</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </>
                            )}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card / Labelled List View (< 640px) */}
          <div className="sm:hidden space-y-3">
            {filteredProjects.map((project) => {
              const chip = getStatusChipProps(project.status);
              const link = getActionLink(project);

              return (
                <div
                  key={project.id}
                  className="p-4 rounded-panel border border-hairline bg-canvas flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-base text-ink line-clamp-1">
                      {project.title}
                    </h3>
                    <StatusChip kind={chip.kind} label={chip.label} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-moss">
                    <span>Target: {project.targetSkill}</span>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>

                  <div className="pt-2 border-t border-hairline flex justify-end">
                    <Link to={link} className="w-full">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        {project.status === 'failed' ? 'Retry review' : 'Open project'}
                      </Button>
                    </Link>
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
export default ProjectsPage;
