import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { upsertRows } from '../../lib/supabase-rest';
import {
  ADMIN_ACCOUNTS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminAccountFromRequest,
  createAdminSessionToken,
  publicAdminProfile,
} from '../../lib/admin-session';

export const runtime = 'nodejs';

const ROOT_ADMIN_ROLES = ['admin', 'cs', 'parent', 'user'];

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
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
  const response = NextResponse.json({ ok: true, profile: publicAdminProfile(account), profileSynced });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(account.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const account = adminAccountFromRequest(request);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, profile: publicAdminProfile(account) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
