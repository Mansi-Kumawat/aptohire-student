import { describe, expect, it } from 'vitest';
import { publicVerifyResponseSchema } from '@/lib/schemas';

describe('public-verify response contract', () => {
  const validResponse = {
    credential: {
      credential_id: 'a1b2c3d4e5f6a7b8c9',
      issued_at: '2026-10-12',
      last_updated: '2026-10-12',
      skills: [
        { name: 'React', level: 'Proficient', verified: true, score: 72 },
        { name: 'Rust', level: 'Competent', verified: false },
      ],
      shared_fields: ['skills', 'levels'],
    },
  };

  it('accepts optional fields being absent and preserves verification flags', () => {
    const parsed = publicVerifyResponseSchema.parse(validResponse);
    expect(parsed.credential.display_name).toBeUndefined();
    expect(parsed.credential.affiliation).toBeUndefined();
    expect(parsed.credential.skills.map((skill) => skill.verified)).toEqual([true, false]);
  });

  it('rejects non-lowercase or incorrectly sized credential IDs', () => {
    expect(() => publicVerifyResponseSchema.parse({
      credential: { ...validResponse.credential, credential_id: 'A1b2c3d4e5f6a7b8c9' },
    })).toThrow();
    expect(() => publicVerifyResponseSchema.parse({
      credential: { ...validResponse.credential, credential_id: 'a1b2c3' },
    })).toThrow();
  });

  it('drops unknown response fields and rejects out-of-range scores', () => {
    const parsed = publicVerifyResponseSchema.parse({
      credential: { ...validResponse.credential, private_email: 'not-renderable@example.test' },
    });
    expect(parsed.credential).not.toHaveProperty('private_email');
    expect(() => publicVerifyResponseSchema.parse({
      credential: {
        ...validResponse.credential,
        skills: [{ name: 'React', level: 'Proficient', verified: true, score: 101 }],
      },
    })).toThrow();
  });
});
