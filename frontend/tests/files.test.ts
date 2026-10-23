import { describe, it, expect } from 'vitest';
import { validateVideoFile, validateMagicBytes } from '@/lib/files';
import { isValidGitHubUrl, isValidHttpsUrl } from '@/lib/format';
import { loginSchema, submissionFormSchema } from '@/lib/schemas';

describe('File and URL Validators', () => {
  it('returns exact duration failure copy when video is too long', () => {
    const file = new File(['dummy content'], 'demo.mp4', { type: 'video/mp4' });
    const res = validateVideoFile(file, 50, 190, 222); // 222s = 3:42
    expect(res.valid).toBe(false);
    expect(res.error).toBe(
      'This video is 3:42. Videos must be 3:10 or shorter. Trim it and upload again.'
    );
  });

  it('returns exact size failure copy when video is too large', () => {
    // 74 MB file mock without allocating 74MB in memory
    const file = new File(['small content'], 'demo.mp4', { type: 'video/mp4' });
    Object.defineProperty(file, 'size', { value: 74 * 1024 * 1024 });
    const res = validateVideoFile(file, 50, 190, 120);
    expect(res.valid).toBe(false);
    expect(res.error).toBe(
      'This video is 74 MB. The limit is 50 MB. Compress it and upload again.'
    );
  });

  it('validates magic bytes for PDF format (%PDF header)', async () => {
    // Valid %PDF header (0x25, 0x50, 0x44, 0x46)
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const validPdfFile = new File([validPdfBytes], 'report.pdf', { type: 'application/pdf' });
    const validRes = await validateMagicBytes(validPdfFile);
    expect(validRes.valid).toBe(true);

    // Invalid bytes with .pdf extension
    const fakePdfBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const fakePdfFile = new File([fakePdfBytes], 'fake.pdf', { type: 'application/pdf' });
    const fakeRes = await validateMagicBytes(fakePdfFile);
    expect(fakeRes.valid).toBe(false);
    expect(fakeRes.error).toBe('File content does not match PDF format.');
  });

  it('validates GitHub URLs strictly', () => {
    expect(isValidGitHubUrl('https://github.com/aarav-dev/product-catalog')).toBe(true);
    expect(isValidGitHubUrl('http://github.com/aarav-dev/product-catalog')).toBe(false); // http rejected
    expect(isValidGitHubUrl('https://gitlab.com/aarav-dev/product-catalog')).toBe(false);
    expect(isValidGitHubUrl('https://github.com/aarav-dev')).toBe(false); // missing repo
    expect(isValidGitHubUrl('not-a-url')).toBe(false);
  });

  it('validates HTTPS URLs', () => {
    expect(isValidHttpsUrl('https://aarav-catalog-demo.test')).toBe(true);
    expect(isValidHttpsUrl('http://insecure.test')).toBe(false);
    expect(isValidHttpsUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('Zod Schema Validation', () => {
  it('validates login schema', () => {
    expect(loginSchema.safeParse({ email: 'valid@uni.edu', password: 'secret' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'invalid-email', password: '' }).success).toBe(false);
  });

  it('validates submission form schema requirements', () => {
    const validData = {
      title: 'Accessible Catalog',
      description: 'Built with React and TypeScript',
      skills_claimed: ['React'],
      github_url: 'https://github.com/owner/repo',
      live_url: 'https://demo.app',
      ai_used: false,
    };
    expect(submissionFormSchema.safeParse(validData).success).toBe(true);

    const invalidMissingSkills = {
      title: 'Valid Title',
      skills_claimed: [], // At least one skill required!
    };
    expect(submissionFormSchema.safeParse(invalidMissingSkills).success).toBe(false);
  });
});

describe('Supabase Storage Security Contracts', () => {
  it('requires signed URLs for video playback and document access', async () => {
    const { MockBackend } = await import('@/lib/backend/mock');
    const backend = new MockBackend();

    const signedPlayback = await backend.uploads.getSignedPlaybackUrl('sub-1', 'videos/sub-1/demo.mp4');
    expect(signedPlayback).toBeDefined();
    expect(typeof signedPlayback).toBe('string');

    const signedDoc = await backend.uploads.getSignedDocumentUrl('sub-1', 'docs/sub-1/spec.pdf');
    expect(signedDoc).toContain('mock-signed-url://');
    expect(signedDoc).toContain('expires=');
  });

  it('generates signed URLs for uploaded student avatars', async () => {
    const { MockBackend } = await import('@/lib/backend/mock');
    const backend = new MockBackend();
    const blob = new Blob(['fake image bytes'], { type: 'image/jpeg' });
    const res = await backend.student.uploadAvatar('user-aarav', blob);

    expect(res).toHaveProperty('avatar_url');
    expect(res.avatar_url).toContain('token=signed_');
  });
});
