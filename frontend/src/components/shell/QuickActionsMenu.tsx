import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Zap,
  ChevronDown,
  Sparkles,
  FileText,
  Share2,
  Award,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActionsMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 h-9 px-3 rounded-control bg-canvas border border-hairline hover:border-verdant-300 hover:bg-verdant-50/50 text-ink text-xs font-semibold shadow-subtle transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant-600"
          aria-label="Quick Actions Menu"
        >
          <Zap className="w-3.5 h-3.5 text-verdant-700" />
          <span className="hidden sm:inline">Quick Actions</span>
          <ChevronDown className="w-3 h-3 text-moss" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-panel border border-hairline bg-canvas p-1.5 shadow-modal focus:outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 py-1.5 border-b border-hairline mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-moss">
              Shortcuts
            </span>
            <span className="text-[10px] font-semibold text-verdant-700 bg-verdant-50 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              to="/projects/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none transition-colors"
            >
              <Sparkles className="w-4 h-4 text-verdant-700 shrink-0" />
              <div>
                <p className="font-semibold text-ink">Get Project Brief</p>
                <p className="text-[11px] text-moss">AI-tailored rubric challenge</p>
              </div>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/scorecard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none transition-colors"
            >
              <Award className="w-4 h-4 text-verdant-700 shrink-0" />
              <div>
                <p className="font-semibold text-ink">Skill Scorecard</p>
                <p className="text-[11px] text-moss">Proof rings & evidence trails</p>
              </div>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/resume"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none transition-colors"
            >
              <FileText className="w-4 h-4 text-verdant-700 shrink-0" />
              <div>
                <p className="font-semibold text-ink">Digital Resume</p>
                <p className="text-[11px] text-moss">Export PDF with verify QR</p>
              </div>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              to="/sharing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none transition-colors"
            >
              <Share2 className="w-4 h-4 text-verdant-700 shrink-0" />
              <div>
                <p className="font-semibold text-ink">Employer Access</p>
                <p className="text-[11px] text-moss">Manage permissions & requests</p>
              </div>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-hairline my-1" />

          <DropdownMenu.Item asChild>
            <Link
              to="/verify"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-moss hover:text-ink rounded-control hover:bg-mist cursor-pointer focus:bg-mist focus:outline-none transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-moss" />
                <span>Lookup Credentials</span>
              </span>
              <span className="text-[10px] text-moss/70">Public</span>
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
