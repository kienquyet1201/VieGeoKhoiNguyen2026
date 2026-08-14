import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { upsertRows } from '../../lib/supabase-rest';

export const runtime = 'nodejs';

const COOKIE_NAME = 'viegeo_admin_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const ROOT_ADMIN_ROLES = ['admin', 'cs', 'parent', 'user'];
const ADMIN_ACCOUNTS = [
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

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET
    || process.env.SET_ADMIN_SECRET
    || ADMIN_ACCOUNTS.map(account => account.passwordHash).join(':');
}

function signPayload(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function createToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

function verifyToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!data.email || Number(data.exp) <= Math.floor(Date.now() / 1000)) return null;
    return ADMIN_ACCOUNTS.find(account => account.email === data.email) || null;
  } catch {
    return null;
  }
}

function publicProfile(account: (typeof ADMIN_ACCOUNTS)[number]) {
  return {
    email: account.email,
    user_name: account.userName,
    name: account.name,
    full_name: account.name,
    role: 'admin',
    roles: ROOT_ADMIN_ROLES,
    active_role: 'admin',
    account_status: 'premium',
    force_logout: false,
    isAdmin: true,
    isSuperAdmin: true,
  };
}

async function syncProfile(account: (typeof ADMIN_ACCOUNTS)[number]) {
  const row = {
    email: account.email,
    user_name: account.userName,
    name: account.name,
    full_name: account.name,
    role: 'admin',
    roles: ROOT_ADMIN_ROLES,
    active_role: 'admin',
    account_status: 'premium',
    force_logout: false,
    updated_at: new Date().toISOString(),
    legacy_data: { isAdmin: true, isSuperAdmin: true, unrestrictedAdmin: true },
  };
  try {
    await upsertRows('users', [row], 'email', true);
    return true;
  } catch (serviceError) {
    try {
      await upsertRows('users', [row], 'email', false);
      return true;
    } catch (anonError) {
      const compatibleRow = {
        id: account.id,
        email: account.email,
        user_email: account.email,
        user_name: account.userName,
        role: 'admin',
        score: 0,
        current_streak: 0,
      };
      try {
        await upsertRows('users', [compatibleRow], 'email', true);
        return true;
      } catch {
        try {
          await upsertRows('users', [compatibleRow], 'email', false);
          return true;
        } catch (compatibleError) {
          console.error('[VieGeo Admin] Không thể đồng bộ hồ sơ quản trị:', serviceError, anonError, compatibleError);
          return false;
        }
      }
    }
  }
}

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string } = {};
  try { body = await request.json(); } catch {}
  const username = String(body.username || '').trim().toLowerCase();
  const passwordHash = sha256(String(body.password || ''));
  const account = ADMIN_ACCOUNTS.find(candidate => candidate.username === username);
  if (!account || !safeEqual(passwordHash, account.passwordHash)) {
    return NextResponse.json({ ok: false, error: 'Thông tin quản trị không đúng.' }, { status: 401 });
  }

  const profileSynced = await syncProfile(account);
  const response = NextResponse.json({ ok: true, profile: publicProfile(account), profileSynced });
  response.cookies.set(COOKIE_NAME, createToken(account.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const account = verifyToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, profile: publicProfile(account) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
