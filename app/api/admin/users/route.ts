import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '../../../lib/supabase-auth';
import { selectRows, upsertRows } from '../../../lib/supabase-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['user', 'parent', 'cs', 'admin'] as const;
type Role = typeof ALLOWED_ROLES[number];
type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  roles: Role[] | string | null;
  is_premium: boolean;
  streak: number;
  xp: number;
  gems: number;
  updated_at?: string;
};

function rolesOf(value: unknown, role?: unknown): Role[] {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  const normalised = raw
    .map((item) => String(item).trim().toLowerCase())
    .map((item) => item === 'cskh' || item === 'support' ? 'cs' : item === 'student' ? 'user' : item)
    .filter((item): item is Role => ALLOWED_ROLES.includes(item as Role));
  const primary = String(role ?? '').trim().toLowerCase() as Role;
  if (ALLOWED_ROLES.includes(primary) && !normalised.includes(primary)) normalised.push(primary);
  return [...new Set(normalised)];
}

async function requireAdmin(request: NextRequest): Promise<UserProfile | null> {
  const authUser = await authenticatedSupabaseUser(request);
  if (!authUser) return null;
  const rows = await selectRows<UserProfile>('users', `select=id,email,display_name,role,roles,is_premium,streak,xp,gems,updated_at&id=eq.${encodeURIComponent(authUser.id)}&limit=1`, true);
  const profile = rows[0] || null;
  return profile && rolesOf(profile.roles, profile.role).includes('admin') ? profile : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!await requireAdmin(request)) return NextResponse.json({ error: 'Không được phép.' }, { status: 403 });
    const users = await selectRows<UserProfile>(
      'users',
      'select=id,email,display_name,role,roles,is_premium,streak,xp,gems,updated_at&order=xp.desc,streak.desc,display_name.asc&limit=1000',
      true,
    );
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[VieGeo Admin API] Không thể tải người dùng:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách người dùng.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!await requireAdmin(request)) return NextResponse.json({ error: 'Không được phép.' }, { status: 403 });
    const body = await request.json();
    const targetUserId = String(body?.targetUserId || '').trim();
    if (!targetUserId) return NextResponse.json({ error: 'Thiếu mã người dùng.' }, { status: 400 });

    const target = (await selectRows<UserProfile>(
      'users',
      `select=id,email,display_name,role,roles,is_premium,streak,xp,gems,updated_at&id=eq.${encodeURIComponent(targetUserId)}&limit=1`,
      true,
    ))[0];
    if (!target) return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });

    const requestedRoles = body?.roles === undefined ? rolesOf(target.roles, target.role) : rolesOf(body.roles);
    if (!requestedRoles.length) return NextResponse.json({ error: 'Mỗi tài khoản phải có ít nhất một vai trò hợp lệ.' }, { status: 400 });
    const primaryRole = requestedRoles.includes(target.role) ? target.role : requestedRoles[0];
    const isPremium = typeof body?.isPremium === 'boolean' ? body.isPremium : target.is_premium === true;
    const [updated] = await upsertRows<UserProfile>('users', [{
      ...target,
      role: primaryRole,
      roles: requestedRoles,
      is_premium: isPremium,
      updated_at: new Date().toISOString(),
    }], 'id', true);
    return NextResponse.json({ user: updated || { ...target, role: primaryRole, roles: requestedRoles, is_premium: isPremium } });
  } catch (error) {
    console.error('[VieGeo Admin API] Không thể cập nhật người dùng:', error);
    return NextResponse.json({ error: 'Không thể cập nhật người dùng.' }, { status: 500 });
  }
}
