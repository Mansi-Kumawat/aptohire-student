import { AuthUser } from '@/lib/backend/types';

const STORAGE_SESSION_KEY = 'aptohire_auth_session';
const COOKIE_SESSION_NAME = 'aptohire_session';
const COOKIE_TOKEN_NAME = 'aptohire_token';
const COOKIE_USER_ID_NAME = 'aptohire_user_id';
const COOKIE_ROLE_NAME = 'aptohire_role';

/**
 * Reads a cookie by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.split('=');
      if (key?.trim() === name) {
        return decodeURIComponent(rest.join('='));
      }
    }
  } catch {
    // ignore parsing errors
  }
  return null;
}

/**
 * Sets a cookie with security attributes (SameSite=Lax, path=/, max-age)
 */
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = days * 24 * 60 * 60;
    const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  } catch {
    // ignore
  }
}

/**
 * Deletes a cookie by expiring it
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  try {
    const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
    const secureFlag = isHttps ? '; Secure' : '';
    document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`;
  } catch {
    // ignore
  }
}

/**
 * Persists user session across localStorage, sessionStorage, and document.cookie.
 * Guarantees cross-tab synchronization and long-term session persistence.
 */
export function saveAuthSession(user: AuthUser, remember = true): void {
  const serialized = JSON.stringify(user);
  const days = remember ? 30 : 1;

  // 1. Session & Local Storage
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, serialized);
  } catch {
    // localStorage might be full or disabled
  }

  try {
    sessionStorage.setItem(STORAGE_SESSION_KEY, serialized);
  } catch {
    // ignore
  }

  // 2. HTTP / Browser Cookies
  setCookie(COOKIE_SESSION_NAME, serialized, days);
  setCookie(COOKIE_USER_ID_NAME, user.id, days);
  setCookie(COOKIE_ROLE_NAME, user.role, days);
  setCookie(COOKIE_TOKEN_NAME, `aptohire-token-${user.id}-${Date.now()}`, days);
}

/**
 * Retrieves the currently authenticated user from any available persistent store.
 * Hierarchy: localStorage -> sessionStorage -> document.cookie.
 * Automatically re-hydrates missing stores for resilience.
 */
export function getAuthSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  let foundUser: AuthUser | null = null;

  // Check 1: localStorage (shared across all tabs & browser restarts)
  try {
    const rawLocal = localStorage.getItem(STORAGE_SESSION_KEY);
    if (rawLocal) {
      foundUser = JSON.parse(rawLocal);
    }
  } catch {
    // ignore
  }

  // Check 2: sessionStorage (active tab state)
  if (!foundUser) {
    try {
      const rawSession = sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (rawSession) {
        foundUser = JSON.parse(rawSession);
      }
    } catch {
      // ignore
    }
  }

  // Check 3: Cookie store (document.cookie)
  if (!foundUser) {
    try {
      const rawCookie = getCookie(COOKIE_SESSION_NAME);
      if (rawCookie) {
        foundUser = JSON.parse(rawCookie);
      }
    } catch {
      // ignore
    }
  }

  // Self-healing rehydration: keep all 3 stores in perfect synchronization
  if (foundUser) {
    try {
      const serialized = JSON.stringify(foundUser);
      if (!localStorage.getItem(STORAGE_SESSION_KEY)) {
        localStorage.setItem(STORAGE_SESSION_KEY, serialized);
      }
      if (!sessionStorage.getItem(STORAGE_SESSION_KEY)) {
        sessionStorage.setItem(STORAGE_SESSION_KEY, serialized);
      }
      if (!getCookie(COOKIE_SESSION_NAME)) {
        setCookie(COOKIE_SESSION_NAME, serialized, 30);
        setCookie(COOKIE_USER_ID_NAME, foundUser.id, 30);
        setCookie(COOKIE_ROLE_NAME, foundUser.role, 30);
        setCookie(COOKIE_TOKEN_NAME, `aptohire-token-${foundUser.id}`, 30);
      }
    } catch {
      // ignore
    }
  }

  return foundUser;
}

/**
 * Clears the session completely across localStorage, sessionStorage, and all cookies.
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch {
    // ignore
  }

  try {
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  } catch {
    // ignore
  }

  deleteCookie(COOKIE_SESSION_NAME);
  deleteCookie(COOKIE_TOKEN_NAME);
  deleteCookie(COOKIE_USER_ID_NAME);
  deleteCookie(COOKIE_ROLE_NAME);
}

/**
 * Listens for cross-tab session changes (sign in or sign out in another tab).
 */
export function onSessionSync(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_SESSION_KEY) {
      if (!e.newValue) {
        callback(null);
      } else {
        try {
          callback(JSON.parse(e.newValue));
        } catch {
          callback(null);
        }
      }
    }
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
