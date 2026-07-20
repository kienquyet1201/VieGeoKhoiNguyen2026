import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '../../lib/firebase-admin';

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
    // The safe default is the one approved administrator account.
  }

  if (requestedEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'API này chỉ cấp quyền cho tài khoản quản trị đã định.' }, { status: 403 });
  }

  try {
    const { adminAuth, adminDb } = getAdminServices();
    await adminDb.collection('users').doc(ADMIN_EMAIL).set({
      email: ADMIN_EMAIL,
      role: 'admin',
      roles: FieldValue.arrayUnion('admin', 'cs', 'user'),
      isAdmin: true,
      isCustomerSupport: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    try {
      const user = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      await adminAuth.setCustomUserClaims(user.uid, { admin: true, cs: true });
    } catch (error) {
      // The legacy app may not have Firebase Auth accounts yet. Firestore RBAC is still updated.
      console.warn('Không thể gán Custom Claims cho tài khoản Firebase Auth:', error);
    }

    return NextResponse.json({ ok: true, email: ADMIN_EMAIL, roles: ['admin', 'cs', 'user'] });
  } catch (error) {
    console.error('Không thể cấp quyền quản trị:', error);
    return NextResponse.json({ error: 'Không thể cấp quyền. Kiểm tra biến môi trường Firebase Admin.' }, { status: 500 });
  }
}
