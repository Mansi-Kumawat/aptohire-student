import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SkillItem, SkillEdge, SkillScore } from '@/lib/domain/types';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { StatusChip } from './StatusChip';
import { LayoutGrid, List as ListIcon, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as d3Force from 'd3-force';

interface SkillGraphProps {
  skills: SkillItem[];
  edges: SkillEdge[];
  scores: SkillScore[];
  onSelectSkill?: (skill: SkillItem) => void;
  className?: string;
}

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  name: string;
  slug: string;
  family: string;
  score?: number;
  isVerified: boolean;
  isInProgress: boolean;
  x?: number;
  y?: number;
}

export const SkillGraph: React.FC<SkillGraphProps> = ({
  skills,
  edges,
  scores,
  onSelectSkill,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Default to list below 768px or if prefers-reduced-motion
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (isMobile || prefersReducedMotion) {
      setViewMode('list');
    }
  }, []);

  // Map scores by skill slug / name
  const scoreMap = useMemo(() => {
    const map = new Map<string, SkillScore>();
    scores.forEach((s) => {
      map.set(s.skill_slug.toLowerCase(), s);
      map.set(s.skill_name.toLowerCase(), s);
    });
    return map;
  }, [scores]);

  // Construct graph nodes
  const nodes: GraphNode[] = useMemo(() => {
    return skills.map((skill) => {
      const scoreObj = scoreMap.get(skill.slug.toLowerCase()) || scoreMap.get(skill.name.toLowerCase());
      const scoreVal = scoreObj?.score;
      const isVerified = scoreObj?.is_verified || false;
      const isInProgress = !isVerified && scoreVal !== undefined && scoreVal > 0;

      return {
        id: skill.name,
        name: skill.name,
        slug: skill.slug,
        family: skill.family,
        score: scoreVal,
        isVerified,
        isInProgress,
      };
    });
  }, [skills, scoreMap]);

  // Run d3-force layout statically
  const [computedNodes, setComputedNodes] = useState<GraphNode[]>([]);
  const [computedLinks, setComputedLinks] = useState<{ source: GraphNode; target: GraphNode }[]>([]);

  useEffect(() => {
    const width = 640;
    const height = 400;

    const simNodes: GraphNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: d3Force.SimulationLinkDatum<GraphNode>[] = edges
      .filter((e) =>
        simNodes.some((n) => n.id === e.source) && simNodes.some((n) => n.id === e.target)
      )
      .map((e) => ({ source: e.source, target: e.target }));

    const simulation = d3Force
      .forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        d3Force
          .forceLink<GraphNode, d3Force.SimulationLinkDatum<GraphNode>>(simLinks)
          .id((d) => d.id)
          .distance(70)
      )
      .force('charge', d3Force.forceManyBody().strength(-120))
      .force('center', d3Force.forceCenter(width / 2, height / 2))
      .force('collision', d3Force.forceCollide().radius(35))
      .stop();

    // Run 100 ticks statically
    for (let i = 0; i < 100; i++) simulation.tick();

    setComputedNodes(simNodes);
    setComputedLinks(
      simLinks.map((l) => ({
        source: l.source as GraphNode,
        target: l.target as GraphNode,
      }))
    );
  }, [nodes, edges]);

  // Arrow key navigation between nodes
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % computedNodes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + computedNodes.length) % computedNodes.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      const item = skills.find((s) => s.name === computedNodes[index].name);
      if (item) {
        setSelectedSkill(item);
        onSelectSkill?.(item);
      }
      return;
    }
    if (nextIndex !== index) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
    }
  };

  return (
    <div className={cn('border border-hairline rounded-panel bg-canvas p-4 md:p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-ink">Living skill graph</h3>
          <p className="text-xs text-moss">
            Explore verified competencies and connected skill paths
          </p>
        </div>

        <div className="flex items-center gap-1 bg-mist p-1 rounded-control border border-hairline">
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-colors',
              viewMode === 'graph' ? 'bg-canvas text-ink shadow-sm' : 'text-moss hover:text-ink'
            )}
            aria-label="Graph view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Graph</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-colors',
              viewMode === 'list' ? 'bg-canvas text-ink shadow-sm' : 'text-moss hover:text-ink'
            )}
            aria-label="List view"
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="relative w-full overflow-hidden rounded-panel border border-hairline bg-mist/30">
          <svg
            ref={svgRef}
            viewBox="0 0 640 400"
            className="w-full h-80 sm:h-96"
            role="region"
            aria-label="Interactive skill graph"
          >
            {/* Edges */}
            <g>
              {computedLinks.map((link, idx) => (
                <line
                  key={idx}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke="#D5DDD8"
                  strokeWidth="1.2"
                />
              ))}
            </g>

            {/* Nodes */}
            <g>
              {computedNodes.map((node, idx) => {
                const radius = node.score ? Math.max(18, Math.min(28, node.score / 3.2)) : 16;
                const isSelected = selectedSkill?.name === node.name;
                const isFocused = focusedIndex === idx;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x || 0}, ${node.y || 0})`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.name}, ${node.isVerified ? 'verified' : node.isInProgress ? 'in progress' : 'not assessed'}`}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onClick={() => {
                      const item = skills.find((s) => s.name === node.name);
                      if (item) {
                        setSelectedSkill(item);
                        onSelectSkill?.(item);
                      }
                    }}
                    className="cursor-pointer focus:outline-none group"
                  >
                    {/* Ring highlight on focus/select */}
                    {(isSelected || isFocused) && (
                      <circle
                        r={radius + 5}
                        fill="none"
                        stroke="#0E9F5B"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    )}

                    <circle
                      r={radius}
                      fill={
                        node.isVerified
                          ? '#0E9F5B'
                          : node.isInProgress
                          ? '#FFFFFF'
                          : '#FFFFFF'
                      }
                      stroke={
                        node.isVerified
                          ? '#0B7F49'
                          : node.isInProgress
                          ? '#FF7A1A'
                          : '#E3E8E5'
                      }
                      strokeWidth={node.isInProgress ? 2.5 : 1.5}
                      strokeDasharray={!node.score ? '3 3' : undefined}
                      className="transition-transform duration-fast group-hover:scale-105"
                    />

                    {node.isVerified && (
                      <Check
                        x={-6}
                        y={-6}
                        width={12}
                        height={12}
                        className="text-white pointer-events-none stroke-[3]"
                      />
                    )}

                    <text
                      y={radius + 13}
                      textAnchor="middle"
                      className="text-[11px] font-medium font-body fill-ink select-none"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Node detail drawer / info popup */}
          {selectedSkill && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-canvas border border-hairline rounded-panel p-4 shadow-float animate-in fade-in duration-fast">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ink text-sm">{selectedSkill.name}</span>
                <StatusChip
                  kind={
                    scoreMap.get(selectedSkill.slug)?.is_verified
                      ? 'verified'
                      : scoreMap.get(selectedSkill.slug)?.score
                      ? 'pending'
                      : 'emerging'
                  }
                  label={
                    scoreMap.get(selectedSkill.slug)?.is_verified
                      ? 'Verified'
                      : scoreMap.get(selectedSkill.slug)?.score
                      ? 'In Progress'
                      : 'Not Assessed'
                  }
                />
              </div>
              <p className="text-xs text-moss mb-3">Family: {selectedSkill.family}</p>
              <div className="flex items-center gap-2">
                {scoreMap.get(selectedSkill.slug) ? (
                  <Link
                    to={`/scorecard/${selectedSkill.slug}`}
                    className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1"
                  >
                    <span>View scorecard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/projects/new"
                    className="text-xs font-semibold text-verdant-700 hover:text-verdant-800 flex items-center gap-1"
                  >
                    <span>Start project brief</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible List View */
        <div className="space-y-2">
          {skills.map((skill) => {
            const scoreObj = scoreMap.get(skill.slug);
            return (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 rounded-control border border-hairline hover:bg-mist/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-semibold text-ink">{skill.name}</h4>
                  <p className="text-xs text-moss">{skill.family}</p>
                </div>

                <div className="flex items-center gap-3">
                  {scoreObj ? (
                    <StatusChip
                      kind={scoreObj.is_verified ? 'verified' : 'under-review'}
                      label={scoreObj.is_verified ? `Verified (${scoreObj.score})` : `Score: ${scoreObj.score}`}
                    />
                  ) : (
                    <span className="text-xs text-moss">Not assessed</span>
                  )}
                  <Link to={`/scorecard/${skill.slug}`}>
                    <Button variant="ghost" size="sm" className="h-[32px] px-2 text-xs">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
