const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mijjvqkfkzwpmjpwkbgk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pamp2cWtma3p3cG1qcHdrYmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTI3MzgsImV4cCI6MjEwMTc2ODczOH0.KKomdXKDi1sn7Ems1JxaFLrecq2oA_xVqMgo1jvUhiY';

function apiKey(useServiceRole = false) {
  return useServiceRole ? (process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY) : SUPABASE_ANON_KEY;
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
