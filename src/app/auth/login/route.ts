import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitch',
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: 'user:read:email',
    },
  });
  if (error || !data?.url) {
    return NextResponse.redirect(new URL('/?auth_error=login', origin));
  }
  return NextResponse.redirect(data.url);
}
