import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`);
  }
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/?auth_error=missing_code`);
}