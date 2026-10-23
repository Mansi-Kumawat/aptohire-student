import { env } from './env';

function cleanPath(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

export function rootUrl(path = ''): string {
  let base = env.VITE_ROOT_URL;
  if (typeof window !== 'undefined' && window.location?.origin) {
    // If deployed on remote host (like Vercel) but base still has localhost, use current origin
    if (!base || (base.includes('localhost') && !window.location.hostname.includes('localhost'))) {
      base = window.location.origin;
    }
  }
  base = base || `https://${env.VITE_ROOT_DOMAIN}`;
  return `${base.replace(/\/$/, '')}${cleanPath(path)}`;
}

export function portalUrl(
  portal: 'university' | 'organization',
  path = ''
): string {
  if (portal === 'university' && env.VITE_UNIVERSITY_URL) {
    return `${env.VITE_UNIVERSITY_URL.replace(/\/$/, '')}${cleanPath(path)}`;
  }
  if (portal === 'organization' && env.VITE_ORGANIZATION_URL) {
    return `${env.VITE_ORGANIZATION_URL.replace(/\/$/, '')}${cleanPath(path)}`;
  }
  return `https://${portal}.${env.VITE_ROOT_DOMAIN}${cleanPath(path)}`;
}
