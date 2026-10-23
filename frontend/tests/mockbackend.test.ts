import { describe, it, expect } from 'vitest';
import { MockBackend } from '@/lib/backend/mock';

describe('Mock Backend Implementation', () => {
  it('initializes with seed data for Aarav, Naman, Avi, Niya', async () => {
    const backend = new MockBackend();

    const aaravScores = await backend.scores.listSkillScores('user-aarav');
    expect(aaravScores.length).toBeGreaterThanOrEqual(2);
    expect(aaravScores.some((s) => s.skill_name === 'React' && s.score === 72 && s.is_verified)).toBe(true);

    const aviAffiliations = await backend.affiliations.listAffiliations('user-avi');
    expect(aviAffiliations.length).toBeGreaterThan(0);
    const aviProposals = await backend.affiliations.listProposals('user-avi');
    expect(aviProposals.length).toBe(1);
    expect(aviProposals[0].university_name).toContain('Uni B');
  });

  it('preserves Avi scores when confirming a new university proposal', async () => {
    const backend = new MockBackend();
    const aviScoresBefore = await backend.scores.listSkillScores('user-avi');
    const sqlScoreBefore = aviScoresBefore.find((s) => s.skill_name === 'SQL')?.score;

    // Confirm proposal
    const proposals = await backend.affiliations.listProposals('user-avi');
    const confirmed = await backend.affiliations.confirmAffiliation({
      student_id: 'user-avi',
      proposal_id: proposals[0].id,
    });

    expect(confirmed.is_current).toBe(true);
    expect(confirmed.university_name).toContain('Uni B');

    // Assert scores did not change
    const aviScoresAfter = await backend.scores.listSkillScores('user-avi');
    const sqlScoreAfter = aviScoresAfter.find((s) => s.skill_name === 'SQL')?.score;
    expect(sqlScoreAfter).toBe(sqlScoreBefore);
  });

  it('rejects submission with missing skills', async () => {
    const backend = new MockBackend();
    const draft = await backend.submissions.saveDraft({
      student_id: 'user-naman',
      title: 'Empty skills project',
      skills_claimed: [],
      video_url: 'mock-storage://demo.mp4',
    });

    await expect(
      backend.submissions.submitProject({
        submission_id: draft.id,
        confirm: true,
      })
    ).rejects.toThrow('Choose at least one skill this project shows.');
  });
});
