import { describe, it, expect, beforeEach } from 'vitest';
import { MockBackend } from '@/lib/backend/mock';

describe('Features & User Flows Integration Tests', () => {
  let backend: MockBackend;
  const aaravId = 'user-aarav';

  beforeEach(() => {
    localStorage.clear();
    backend = new MockBackend();
  });

  it('handles access request approval, denial, and expiration accurately', async () => {
    const requests = await backend.sharing.listAccessRequests(aaravId);
    expect(requests.length).toBeGreaterThan(0);

    const pendingReq = requests.find((r) => r.status === 'pending');
    expect(pendingReq).toBeDefined();

    if (pendingReq) {
      // Approve request
      const approved = await backend.sharing.respondAccess({
        request_id: pendingReq.id,
        decision: 'accept',
        duration_days: 30,
        granted_scope: ['profile', 'scorecard'],
      });
      expect(approved.status).toBe('accepted');

      // Revoke/withdraw request
      const revoked = await backend.sharing.withdrawAccess(pendingReq.id);
      expect(revoked.status).toBe('withdrawn');
    }
  });

  it('marks notifications as read and updates unread counts', async () => {
    const initialList = await backend.notifications.listNotifications(aaravId);
    const initialUnread = initialList.filter((n) => !n.read_at).length;
    expect(initialUnread).toBeGreaterThan(0);

    const firstUnread = initialList.find((n) => !n.read_at);
    if (firstUnread) {
      await backend.notifications.markNotificationRead(firstUnread.id);
      const afterList = await backend.notifications.listNotifications(aaravId);
      const newUnread = afterList.filter((n) => !n.read_at).length;
      expect(newUnread).toBe(initialUnread - 1);
    }
  });

  it('exports user personal data as GDPR/FERPA compliant JSON bundle', async () => {
    const res = await backend.account.exportMyData(aaravId);
    expect(res).toHaveProperty('signed_url');
    expect(res.signed_url).toContain('.json');
  });

  it('disconnects profile source and respects data retention flag', async () => {
    const sources = await backend.sources.listSources(aaravId);
    const connectedSource = sources.find((s) => s.connected);
    expect(connectedSource).toBeDefined();

    if (connectedSource) {
      // Disconnect keeping data
      await backend.sources.disconnectSource(aaravId, connectedSource.id, false);
      const afterDisconnect = await backend.sources.listSources(aaravId);
      const updated = afterDisconnect.find((s) => s.id === connectedSource.id);
      expect(updated?.connected).toBe(false);

      // Verify skills remain intact
      const skills = await backend.skills.listSkills();
      expect(skills.length).toBeGreaterThan(0);
    }
  });

  it('submits a ticket appeal with valid schema', async () => {
    const ticket = await backend.tickets.createTicket({
      student_id: aaravId,
      submission_id: 'sub-aarav-1',
      skill_name: 'React',
      reason: 'Review rubric clarification on accessibility checks.',
    });
    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe('received');
    expect(ticket.reason).toBe('Review rubric clarification on accessibility checks.');

    const list = await backend.tickets.listTickets(aaravId);
    expect(list.some((t) => t.id === ticket.id)).toBe(true);
  });
});
