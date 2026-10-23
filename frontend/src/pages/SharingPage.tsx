import React, { useState } from 'react';
import { useSharing } from '@/features/sharing/useSharing';
import { AccessRequest, Scope } from '@/lib/domain/types';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { StatusChip } from '@/components/proof/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { Helmet } from 'react-helmet-async';
import {
  Share2,
  Building2,
  Calendar,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { copy } from '@/content/copy';

export const SharingPage: React.FC = () => {
  const { requests, feedback, isLoading, respondAccess, withdrawAccess } = useSharing();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'history' | 'feedback'>('requests');

  // Consent Sheet State
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [grantedScopes, setGrantedScopes] = useState<Scope[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<7 | 30 | 90>(30);
  const [isResponding, setIsResponding] = useState(false);

  // Withdraw Dialog State
  const [withdrawRequestId, setWithdrawRequestId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const activeGrants = requests.filter((r) => r.status === 'accepted');
  const historyRequests = requests.filter((r) =>
    ['declined', 'withdrawn', 'expired'].includes(r.status)
  );

  const handleOpenConsent = (req: AccessRequest) => {
    setSelectedRequest(req);
    // Pre-check only the scopes they requested
    setGrantedScopes([...req.requested_scopes]);
    setSelectedDuration((req.duration_days as 7 | 30 | 90) || 30);
    setIsConsentOpen(true);
  };

  const toggleScope = (scope: Scope) => {
    if (grantedScopes.includes(scope)) {
      setGrantedScopes(grantedScopes.filter((s) => s !== scope));
    } else {
      setGrantedScopes([...grantedScopes, scope]);
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest || grantedScopes.length === 0) return;
    setIsResponding(true);

    try {
      const res = await respondAccess({
        request_id: selectedRequest.id,
        decision: 'accept',
        granted_scope: grantedScopes,
        duration_days: selectedDuration,
      });

      setIsConsentOpen(false);
      const expiryFormatted = res.expires_at ? formatDate(res.expires_at) : `${selectedDuration} days`;
      toast.success(`Access shared until ${expiryFormatted}.`);
    } catch {
      toast.error('Failed to accept request. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!selectedRequest) return;
    setIsResponding(true);

    try {
      await respondAccess({
        request_id: selectedRequest.id,
        decision: 'decline',
      });

      setIsConsentOpen(false);
      toast.success(copy.sharing.declineToast);
    } catch {
      toast.error('Failed to decline request.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawRequestId) return;
    setIsWithdrawing(true);

    try {
      await withdrawAccess(withdrawRequestId);
      setWithdrawRequestId(null);
      toast.success(copy.sharing.withdrawToast);
    } catch {
      toast.error('Failed to withdraw access.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 antialiased pb-16">
      <Helmet>
        <title>Sharing & Consent · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">
          Sharing & opportunities
        </h1>
        <p className="text-moss text-[15px] mt-1">
          Organizations find your verified skills without seeing your name. You control access.
        </p>
      </div>

      {/* Borderline note */}
      <div className="p-3.5 rounded-control bg-mist border border-hairline text-moss text-xs flex items-center gap-2">
        <Lock className="w-4 h-4 text-moss shrink-0" />
        <span>{copy.review.borderlineSharingNote}</span>
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { id: 'requests', label: 'Requests', badge: pendingRequests.length },
          { id: 'active', label: 'Active access', badge: activeGrants.length },
          { id: 'history', label: 'History', badge: historyRequests.length },
          { id: 'feedback', label: 'Feedback', badge: feedback.length },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'requests' | 'active' | 'history' | 'feedback')}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <>
          {/* TAB 1: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <EmptyState
                  icon={<Share2 className="w-7 h-7 text-moss" />}
                  description={copy.sharing.noRequests}
                />
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-6 rounded-panel border border-hairline bg-canvas hover:border-moss/40 transition-colors shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-moss shrink-0" />
                        <h3 className="font-display font-semibold text-lg text-ink">
                          {req.organization_name}
                        </h3>
                        {req.organization_verified && (
                          <StatusChip kind="verified-organization" />
                        )}
                      </div>
                      <span className="text-xs text-moss">
                        Received {formatDate(req.created_at)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-moss uppercase tracking-wider">
                        Role: {req.job_title}
                      </p>
                      <p className="text-sm text-ink leading-relaxed">"{req.message}"</p>
                    </div>

                    <div className="p-3 rounded-control bg-mist/60 text-xs text-moss flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">Requested data:</span>
                      {req.requested_scopes.map((scope) => (
                        <span
                          key={scope}
                          className="px-2 py-0.5 rounded-full bg-canvas text-ink border border-hairline font-medium"
                        >
                          {scope.charAt(0).toUpperCase() + scope.slice(1)}
                        </span>
                      ))}
                      <span className="ml-auto font-mono">
                        Duration: {req.duration_days} days
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="default"
                        onClick={() => handleOpenConsent(req)}
                      >
                        Review request
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE ACCESS */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeGrants.length === 0 ? (
                <EmptyState
                  icon={<Lock className="w-7 h-7 text-moss" />}
                  description={copy.sharing.noActive}
                />
              ) : (
                activeGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className="p-5 rounded-panel border border-hairline bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-ink">
                          {grant.organization_name}
                        </span>
                        {grant.organization_verified && (
                          <StatusChip kind="verified-organization" />
                        )}
                      </div>
                      <p className="text-xs text-moss">Job: {grant.job_title}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs text-moss">Granted scopes:</span>
                        {(grant.granted_scopes || []).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full bg-verdant-50 text-verdant-800 border border-verdant-100 text-xs font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <span className="text-xs text-moss flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Expires {grant.expires_at ? formatDate(grant.expires_at) : 'in 30 days'}
                        </span>
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWithdrawRequestId(grant.id)}
                        className="text-xs text-danger-600 hover:bg-danger-50"
                      >
                        Withdraw access
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {historyRequests.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-7 h-7 text-moss" />}
                  description="No historical sharing activity."
                />
              ) : (
                historyRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-control border border-hairline bg-mist/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-ink text-sm">{req.organization_name}</p>
                      <p className="text-moss">{req.job_title}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-moss">{formatDate(req.created_at)}</span>
                      <StatusChip kind="declined" label={req.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-7 h-7 text-moss" />}
                  description={copy.sharing.noFeedback}
                />
              ) : (
                feedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-panel border border-hairline bg-canvas space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{item.organization_name}</span>
                      <span className="text-moss">{formatDate(item.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-verdant-50 text-verdant-800 border border-verdant-100">
                        {item.category}: {item.label}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-xs text-moss italic leading-relaxed pt-1">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* CONSENT SHEET */}
      <Sheet open={isConsentOpen} onOpenChange={setIsConsentOpen}>
        <SheetContent side="right" className="max-w-lg">
          {selectedRequest && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-verdant-700 uppercase tracking-wider">
                    Access Request Review
                  </span>
                </div>
                <SheetTitle>{selectedRequest.organization_name}</SheetTitle>
                <SheetDescription>
                  Review the scopes requested for {selectedRequest.job_title}
                </SheetDescription>
              </SheetHeader>

              <div className="p-3.5 rounded-control bg-mist/60 text-xs text-ink/90 leading-relaxed">
                "{selectedRequest.message}"
              </div>

              {/* Scopes with plain descriptions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-ink">Choose what to share:</h4>

                <div className="p-3 rounded-control border border-hairline space-y-1">
                  <Checkbox
                    checked={grantedScopes.includes('profile')}
                    onChange={() => toggleScope('profile')}
                    label="Profile"
                    description="Your name, photo and headline"
                  />
                </div>

                <div className="p-3 rounded-control border border-hairline space-y-1">
                  <Checkbox
                    checked={grantedScopes.includes('scorecard')}
                    onChange={() => toggleScope('scorecard')}
                    label="Scorecard"
                    description="Your verified skills, levels and evidence summary"
                  />
                </div>

                <div className="p-3 rounded-control border border-hairline space-y-1">
                  <Checkbox
                    checked={grantedScopes.includes('projects')}
                    onChange={() => toggleScope('projects')}
                    label="Projects"
                    description="Your project files and videos"
                  />
                </div>

                <div className="p-3 rounded-control border border-hairline space-y-1">
                  <Checkbox
                    checked={grantedScopes.includes('contact')}
                    onChange={() => toggleScope('contact')}
                    label="Contact details"
                    description="Your email address"
                  />
                </div>
              </div>

              {/* Duration select */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink">Duration:</label>
                <Select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseInt(e.target.value, 10) as 7 | 30 | 90)}
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </Select>
              </div>

              <p className="text-xs text-moss">
                You can withdraw access any time from Sharing.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-hairline">
                <Button
                  variant="primary"
                  onClick={handleAcceptRequest}
                  disabled={grantedScopes.length === 0}
                  isLoading={isResponding}
                  className="flex-1"
                >
                  Accept request
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDeclineRequest}
                  disabled={isResponding}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* WITHDRAW ACCESS CONFIRMATION MODAL */}
      <Dialog open={!!withdrawRequestId} onOpenChange={(open) => !open && setWithdrawRequestId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw access?</DialogTitle>
            <DialogDescription>
              This organization will immediately lose access to your profile, scorecard, and projects.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setWithdrawRequestId(null)}>
              Keep access
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmWithdraw}
              isLoading={isWithdrawing}
            >
              Withdraw access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SharingPage;
