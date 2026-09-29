const ROLE_CLAIMS = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

const ID_CLAIMS = [
  'sub',
  'nameid',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
];

const EMAIL_CLAIMS = [
  'email',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
];

export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
  expiresAt: number;
}

function decodePayload(token: string): Record<string, unknown> | null {
  const segment = token.split('.')[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickString(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function pickRoles(payload: Record<string, unknown>): string[] {
  for (const key of ROLE_CLAIMS) {
    const value = payload[key];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function parseAccessToken(token: string): JwtUser | null {
  const payload = decodePayload(token);
  if (!payload) return null;

  const id = pickString(payload, ID_CLAIMS);
  if (!id) return null;

  return {
    id,
    email: pickString(payload, EMAIL_CLAIMS),
    roles: pickRoles(payload),
    expiresAt: typeof payload.exp === 'number' ? payload.exp * 1000 : 0,
  };
}
