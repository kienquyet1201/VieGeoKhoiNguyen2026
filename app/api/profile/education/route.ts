import { NextRequest, NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '../../../lib/supabase-auth';
import { upsertRows } from '../../../lib/supabase-rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validInteger(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : null;
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticatedSupabaseUser(request);
    if (!user) return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 });

    const body = await request.json();
    const age = validInteger(body?.age, 6, 100);
    const schoolGrade = validInteger(body?.schoolGrade, 6, 12);
    if (!age || !schoolGrade) {
      return NextResponse.json({ error: 'Tuổi phải từ 6–100 và lớp phải từ 6–12.' }, { status: 400 });
    }

    const rows = await upsertRows('users', [{
      id: user.id,
      email: user.email,
      age,
      school_grade: schoolGrade,
      textbook_curriculum: 'Chương trình GDPT 2018',
      updated_at: new Date().toISOString(),
    }], 'id', true);

    return NextResponse.json({ ok: true, profile: rows[0] || { email: user.email, age, school_grade: schoolGrade } });
  } catch (error) {
    console.error('[VieGeo API] Không thể cập nhật tuổi/lớp:', error);
    return NextResponse.json({ error: 'Chưa thể lưu thông tin học tập. Vui lòng thử lại.' }, { status: 500 });
  }
}
