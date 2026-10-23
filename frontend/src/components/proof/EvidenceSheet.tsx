import React, { useRef, useState, useEffect } from 'react';
import { EvidenceItem } from '@/lib/domain/types';
import { cn } from '@/lib/cn';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Video, FileCode, FileText, Globe } from 'lucide-react';
import { formatSeconds } from '@/lib/format';

interface EvidenceSheetProps {
  evidence: EvidenceItem | null;
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  transcript?: { t: number; text: string }[];
  githubBaseUrl?: string;
}

export const EvidenceSheet: React.FC<EvidenceSheetProps> = ({
  evidence,
  isOpen,
  onClose,
  videoUrl,
  transcript = [],
  githubBaseUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    if (evidence?.kind === 'video' && evidence.pointer) {
      const targetSec = parseInt(evidence.pointer, 10);
      if (!isNaN(targetSec)) {
        setCurrentTime(targetSec);
        if (videoRef.current) {
          videoRef.current.currentTime = targetSec;
        }
      }
    }
  }, [evidence]);

  if (!evidence) return null;

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const getGitHubLink = () => {
    if (!githubBaseUrl) return null;
    const cleanBase = githubBaseUrl.replace(/\/$/, '');
    // e.g. src/hooks/useFilter.ts#L24-L68
    const [filePath, linePart] = evidence.pointer.split('#');
    if (!filePath) return cleanBase;
    return `${cleanBase}/blob/main/${filePath}${linePart ? `#${linePart}` : ''}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center gap-2 text-verdant-700 text-xs font-semibold uppercase tracking-wider mb-1">
            {evidence.kind === 'video' && <Video className="w-4 h-4" />}
            {evidence.kind === 'repo' && <FileCode className="w-4 h-4" />}
            {evidence.kind === 'doc' && <FileText className="w-4 h-4" />}
            {evidence.kind === 'live' && <Globe className="w-4 h-4" />}
            <span>Evidence Details · {evidence.kind}</span>
          </div>
          <SheetTitle>{evidence.label}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            Ref: {evidence.ref} · Pointer: {evidence.pointer}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pt-2 pb-6">
          {/* VIDEO EVIDENCE */}
          {evidence.kind === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-control bg-ink/90 overflow-hidden relative shadow-sm">
                {videoUrl ? (
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(Math.floor(videoRef.current.currentTime));
                      }
                    }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-canvas/70 p-4 text-center">
                    <Video className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">Video playback at {formatSeconds(currentTime)}</p>
                    <p className="text-xs text-moss/60 mt-1">
                      (Interactive transcript synchronized below)
                    </p>
                  </div>
                )}
              </div>

              {/* Transcript view */}
              {transcript.length > 0 && (
                <div className="border border-hairline rounded-panel p-4 bg-mist/50">
                  <h4 className="text-xs font-semibold text-moss uppercase tracking-wider mb-3">
                    Video Transcript
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {transcript.map((line) => {
                      const isActive = Math.abs(currentTime - line.t) <= 15;
                      return (
                        <button
                          key={line.t}
                          type="button"
                          onClick={() => seekTo(line.t)}
                          className={cn(
                            'w-full text-left p-2 rounded-control text-xs transition-colors flex items-start gap-2.5',
                            isActive
                              ? 'bg-verdant-100 text-verdant-800 font-medium'
                              : 'hover:bg-canvas text-moss hover:text-ink'
                          )}
                        >
                          <span className="font-mono text-[11px] shrink-0 text-moss pt-0.5">
                            {formatSeconds(line.t)}
                          </span>
                          <span>{line.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CODE / REPO / FILE EVIDENCE */}
          {(evidence.kind === 'repo' || evidence.kind === 'file') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-moss bg-mist px-2.5 py-1 rounded-control border border-hairline">
                  {evidence.pointer}
                </span>
                {getGitHubLink() && (
                  <a
                    href={getGitHubLink()!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2"
                  >
                    <span>Open on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {evidence.excerpt && (
                <div className="rounded-control bg-ink p-4 overflow-x-auto shadow-inner text-canvas">
                  <pre className="font-mono text-xs leading-relaxed">
                    <code>{evidence.excerpt}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENT EVIDENCE */}
          {evidence.kind === 'doc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-control border border-hairline bg-mist/60 flex items-center gap-3">
                <FileText className="w-6 h-6 text-verdant-700 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink">{evidence.label}</p>
                  <p className="text-xs text-moss">{evidence.pointer}</p>
                </div>
              </div>

              {evidence.excerpt && (
                <div className="border border-hairline rounded-panel p-4 bg-canvas">
                  <h4 className="text-xs font-semibold text-moss uppercase tracking-wider mb-2">
                    Document Excerpt
                  </h4>
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-mono text-xs">
                    {evidence.excerpt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LIVE LINK EVIDENCE */}
          {evidence.kind === 'live' && (
            <div className="space-y-4">
              <div className="p-4 rounded-control border border-hairline bg-verdant-50/50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-verdant-800">
                  <Globe className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-semibold">Verified Live Deployment</span>
                </div>
                <p className="text-xs text-moss break-all font-mono">
                  {evidence.pointer}
                </p>
                <div>
                  <a
                    href={evidence.pointer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Button variant="primary" size="sm">
                      <span>Open live site</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
