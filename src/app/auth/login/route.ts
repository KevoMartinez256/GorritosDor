import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitch',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: { scope: 'user:read:email' },
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/?auth_error=1`);
  }

  // IMPORTANTÍSIMO: redirigir (no hacer fetch)
  return NextResponse.redirect(data.url);
}
