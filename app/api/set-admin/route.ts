import { NextRequest, NextResponse } from 'next/server';
import { selectRows, upsertRows } from '../../lib/supabase-rest';

export const runtime = 'nodejs';

const ADMIN_EMAILS = ['kienquyet1201@gmail.com', 'admin@viegeo.local'];

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.SET_ADMIN_SECRET;
  const receivedSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Không được phép.' }, { status: 401 });
  }

  let requestedEmail = ADMIN_EMAILS[0];
  try {
    const body = await request.json();
    if (body?.email) requestedEmail = String(body.email).trim().toLowerCase();
  } catch {
    // Safe default: only the approved administrator account.
  }

  if (!ADMIN_EMAILS.includes(requestedEmail)) {
    return NextResponse.json({ error: 'API này chỉ cấp quyền cho tài khoản quản trị đã định.' }, { status: 403 });
  }

  try {
    const profiles = await selectRows<{ id: string }>('users', `select=id&email=eq.${encodeURIComponent(requestedEmail)}&limit=1`, true);
    if (!profiles[0]?.id) {
      return NextResponse.json({ error: 'Tài khoản này chưa tồn tại trong Supabase Auth.' }, { status: 404 });
    }
    await upsertRows('users', [{
      id: profiles[0].id,
      email: requestedEmail,
      role: 'admin',
      roles: ['admin', 'cs', 'parent', 'user'],
      is_premium: true,
      updated_at: new Date().toISOString(),
    }], 'id', true);

    return NextResponse.json({ ok: true, email: requestedEmail, roles: ['admin', 'cs', 'parent', 'user'] });
  } catch (error) {
    console.error('Không thể cấp quyền quản trị qua Supabase:', error);
    return NextResponse.json({ error: 'Không thể cấp quyền. Kiểm tra Supabase key hoặc bảng users.' }, { status: 500 });
  }
}
