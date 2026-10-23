/// <reference types="vite/client" />
import { z } from 'zod';

const getBrowserOrigin = (fallback: string): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return fallback;
};

const sanitizeUrl = (defaultVal: string) =>
  z
    .union([z.string(), z.undefined(), z.null()])
    .transform((val) => {
      if (!val || typeof val !== 'string' || val.trim() === '') {
        return getBrowserOrigin(defaultVal);
      }
      const trimmed = val.trim();
      // Auto-prefix https:// if user provided a bare hostname e.g. "aptohire-student.vercel.app"
      if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    })
    .pipe(
      z
        .string()
        .url()
        .catch(() => getBrowserOrigin(defaultVal))
    );

const envSchema = z.object({
  VITE_APP_ENV: z.enum(['local', 'demo', 'production']).catch('local'),
  VITE_DEMO_MODE: z
    .union([z.string(), z.boolean(), z.undefined()])
    .transform((val) => val === true || val === 'true'),
  VITE_USE_MOCKS: z
    .union([z.string(), z.boolean(), z.undefined()])
    .transform((val) => val === true || val === 'true' || val === undefined),
  VITE_SITE_URL: sanitizeUrl('http://localhost:5174'),
  VITE_ROOT_URL: sanitizeUrl('http://localhost:5173'),
  VITE_ROOT_DOMAIN: z
    .string()
    .optional()
    .transform((val) => {
      if (val && val.trim()) return val.trim();
      if (typeof window !== 'undefined' && window.location?.hostname) {
        return window.location.hostname;
      }
      return 'localhost';
    }),
  VITE_UNIVERSITY_URL: sanitizeUrl('http://localhost:5175'),
  VITE_ORGANIZATION_URL: sanitizeUrl('http://localhost:5176'),
  VITE_SUPABASE_URL: z.string().optional().transform((v) => (v && v.trim() !== '' ? v.trim() : undefined)),
  VITE_SUPABASE_ANON_KEY: z.string().optional().transform((v) => (v && v.trim() !== '' ? v.trim() : undefined)),
  VITE_DEMO_PASSWORD: z.string().optional(),
  VITE_VIDEO_MAX_MB: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((val) => {
      const parsed = parseInt(String(val || 50), 10);
      return isNaN(parsed) ? 50 : parsed;
    }),
  VITE_VIDEO_MAX_SECONDS: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((val) => {
      const parsed = parseInt(String(val || 190), 10);
      return isNaN(parsed) ? 190 : parsed;
    }),
  VITE_SUPPORT_EMAIL: z
    .string()
    .email()
    .catch('support@aptohire.test'),
});

const parsed = envSchema.safeParse(import.meta.env);

export const env = parsed.success
  ? parsed.data
  : {
      VITE_APP_ENV: 'local' as const,
      VITE_DEMO_MODE: true,
      VITE_USE_MOCKS: true,
      VITE_SITE_URL: getBrowserOrigin('http://localhost:5174'),
      VITE_ROOT_URL: getBrowserOrigin('http://localhost:5173'),
      VITE_ROOT_DOMAIN: typeof window !== 'undefined' ? window.location?.hostname || 'localhost' : 'localhost',
      VITE_UNIVERSITY_URL: getBrowserOrigin('http://localhost:5175'),
      VITE_ORGANIZATION_URL: getBrowserOrigin('http://localhost:5176'),
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_ANON_KEY: undefined,
      VITE_DEMO_PASSWORD: 'demo-password-fictional',
      VITE_VIDEO_MAX_MB: 50,
      VITE_VIDEO_MAX_SECONDS: 190,
      VITE_SUPPORT_EMAIL: 'support@aptohire.test',
    };
