import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pamp2cWtma3p3cG1qcHdrYmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTI3MzgsImV4cCI6MjEwMTc2ODczOH0.KKomdXKDi1sn7Ems1JxaFLrecq2oA_xVqMgo1jvUhiY';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL
    || 'https://mijjvqkfkzwpmjpwkbgk.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || DEFAULT_SUPABASE_ANON_KEY;
  const source = [
    `window.ENV_SUPABASE_URL=${JSON.stringify(supabaseUrl)};`,
    `window.ENV_SUPABASE_ANON_KEY=${JSON.stringify(supabaseAnonKey)};`,
    `window.VieGeoRuntimeConfig=Object.freeze({supabaseConfigured:${Boolean(supabaseUrl && supabaseAnonKey)}});`,
  ].join('');

  return new NextResponse(source, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
