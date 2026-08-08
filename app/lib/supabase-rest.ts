const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function apiKey(useServiceRole = false) {
  const key = useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error(useServiceRole
      ? 'Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
      : 'Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return key;
}

function headers(useServiceRole = false) {
  const key = apiKey(useServiceRole);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function selectRows<T>(table: string, query = '', useServiceRole = false): Promise<T[]> {
  const suffix = query ? `?${query}` : '';
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${suffix}`, {
    headers: headers(useServiceRole),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function upsertRows<T extends Record<string, unknown>>(table: string, rows: T[], conflict = 'id', useServiceRole = false): Promise<T[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
    method: 'POST',
    headers: {
      ...headers(useServiceRole),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
