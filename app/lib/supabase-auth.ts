import { NextRequest } from 'next/server';

export type SupabaseAuthenticatedUser = {
  id: string;
  email: string;
};

function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || '';
  return { url, anonKey };
}

export async function authenticatedSupabaseUser(request: NextRequest): Promise<SupabaseAuthenticatedUser | null> {
  try {
    const authorization = String(request.headers.get('authorization') || '');
    const token = authorization.replace(/^Bearer\s+/i, '').trim();
    const { url, anonKey } = publicSupabaseConfig();
    if (!token || !url || !anonKey) return null;

    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const id = String(payload?.id || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    return id && email ? { id, email } : null;
  } catch (error) {
    console.warn('[VieGeo API] Không thể xác thực phiên Supabase:', error);
    return null;
  }
}
