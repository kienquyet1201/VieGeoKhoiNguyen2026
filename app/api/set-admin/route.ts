import { NextRequest, NextResponse } from 'next/server';
import { upsertRows } from '../../lib/supabase-rest';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'kienquyet1201@gmail.com';

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.SET_ADMIN_SECRET;
  const receivedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Không được phép.' }, { status: 401 });
  }

  let requestedEmail = ADMIN_EMAIL;
  try {
    const body = await request.json();
    if (body?.email) requestedEmail = String(body.email).trim().toLowerCase();
  } catch {
    // Safe default: only the approved administrator account.
  }

  if (requestedEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'API này chỉ cấp quyền cho tài khoản quản trị đã định.' }, { status: 403 });
  }

  try {
    await upsertRows('users', [{
      email: ADMIN_EMAIL,
      role: 'admin',
      roles: ['admin', 'cs', 'parent', 'user'],
      active_role: 'admin',
      account_status: 'premium',
      updated_at: new Date().toISOString(),
    }], 'email', true);

    return NextResponse.json({ ok: true, email: ADMIN_EMAIL, roles: ['admin', 'cs', 'parent', 'user'] });
  } catch (error) {
    console.error('Không thể cấp quyền quản trị qua Supabase:', error);
    return NextResponse.json({ error: 'Không thể cấp quyền. Kiểm tra Supabase key hoặc bảng users.' }, { status: 500 });
  }
}
