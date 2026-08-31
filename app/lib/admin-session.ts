import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'viegeo_admin_session';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

export const ADMIN_ACCOUNTS = [
  {
    id: '12012001-0000-4000-8000-000000000001',
    username: 'kienquyet1201@gmail.com',
    email: 'kienquyet1201@gmail.com',
    passwordHash: 'e1d9ebc55fd6baff0590282d9d7d5302047b7ab6ca817c6a47b30b791da3e282',
    name: 'Đặng Kiên Quyết',
    userName: 'adminQuyet',
  },
  {
    id: 'ad000000-0000-4000-8000-000000000002',
    username: 'admin',
    email: 'admin@viegeo.local',
    passwordHash: 'c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f',
    name: 'Admin Tổng',
    userName: 'Admin',
  },
] as const;

export type AdminAccount = (typeof ADMIN_ACCOUNTS)[number];

function secret() {
  return process.env.ADMIN_SESSION_SECRET
    || process.env.SET_ADMIN_SECRET
    || ADMIN_ACCOUNTS.map(account => account.passwordHash).join(':');
}

function signature(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function sameValue(first: string, second: string) {
  const left = Buffer.from(first);
  const right = Buffer.from(second);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionToken(email: string) {
  const payload = Buffer.from(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS,
  })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function adminAccountFromRequest(request: NextRequest): AdminAccount | null {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payload, signed] = token.split('.');
  if (!payload || !signed || !sameValue(signed, signature(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!data.email || Number(data.exp) <= Math.floor(Date.now() / 1000)) return null;
    return ADMIN_ACCOUNTS.find(account => account.email === data.email) || null;
  } catch {
    return null;
  }
}

export function publicAdminProfile(account: AdminAccount) {
  return {
    id: account.id,
    email: account.email,
    user_name: account.userName,
    name: account.name,
    full_name: account.name,
    role: 'admin',
    roles: ['admin', 'cs', 'parent', 'user'],
    active_role: 'admin',
    account_status: 'premium',
    force_logout: false,
    isAdmin: true,
    isSuperAdmin: true,
  };
}
