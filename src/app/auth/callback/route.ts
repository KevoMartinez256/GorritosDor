import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (url.searchParams.has('error') || !code) {
    return NextResponse.redirect(new URL('/?auth_error=callback', url.origin));
  }
  const supabase = supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? '/?auth_error=session' : '/', url.origin));
}
