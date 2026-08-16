function firstConfiguredValue(...values) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pamp2cWtma3p3cG1qcHdrYmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTI3MzgsImV4cCI6MjEwMTc2ODczOH0.KKomdXKDi1sn7Ems1JxaFLrecq2oA_xVqMgo1jvUhiY';

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const supabaseUrl = firstConfiguredValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    'https://mijjvqkfkzwpmjpwkbgk.supabase.co'
  );
  const supabaseAnonKey = firstConfiguredValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    DEFAULT_SUPABASE_ANON_KEY
  );

  const script = [
    `window.ENV_SUPABASE_URL=${JSON.stringify(supabaseUrl)};`,
    `window.ENV_SUPABASE_ANON_KEY=${JSON.stringify(supabaseAnonKey)};`,
    `window.VieGeoSupabaseConfigError=${JSON.stringify(supabaseAnonKey ? '' : 'SUPABASE_CONFIG_MISSING')};`
  ].join('\n');

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).send(script);
};
