import Image from 'next/image'
import Link from 'next/link'
import { createClientServer } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export default async function Home({ searchParams }: { searchParams: Promise<{ auth_error?: string }> }) {
  const { auth_error: authError } = await searchParams
  const supabase = createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin } = user ? await supabase.from('awards_admins').select('user_id').eq('user_id', user.id).maybeSingle() : { data: null }
  const meta = user?.user_metadata ?? {}
  const name = String(meta.full_name ?? meta.name ?? meta.preferred_username ?? user?.email ?? 'Usuario')
  const avatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : typeof meta.picture === 'string' ? meta.picture : null

  return (
    <main className="awards-home">
      <Image src="/gorritos-2026.png" alt="" fill priority sizes="100vw" className="awards-background" />
      <div className="awards-shade" aria-hidden="true" />
      <Link href="/" aria-label="Inicio de Gorritos de Oro" className="absolute top-5 left-5 z-20">
        <Image src="/chaparritaspng.png" alt="" width={50} height={50} priority />
      </Link>
      <section className="awards-content" aria-labelledby="awards-title">
        <p className="awards-eyebrow">LA COMUNIDAD ELIGE</p>
        <h1 id="awards-title" className="awards-title">Gorritos D’or</h1>
        <p className="awards-edition">AWARDS <span aria-hidden="true">/</span> 2026</p>
        <div className="awards-rule" aria-hidden="true" />
        <p className="awards-date"><time dateTime="2026-12-12">12 DE DICIEMBRE</time></p>
        <p className="mt-3 text-sm text-cyan-50/80 sm:text-base">
          Vota en las categorías oficiales
        </p>
        {authError && <p role="alert" className="mt-4 rounded-lg bg-red-950/80 px-4 py-3 text-sm text-red-100">No pudimos completar el acceso con Twitch. Intenta iniciar sesión de nuevo.</p>}
        {!user ? (
          <a href="/auth/login" className="mt-5 block rounded-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Image src="/twitch-button.png" alt="Entrar con Twitch" width={360} height={100} className="h-auto w-[250px] sm:w-[280px]" />
          </a>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/60 px-5 py-4 backdrop-blur-sm">
              {avatar ? (
                <Image src={avatar} alt={`Foto de ${name}`} width={56} height={56} unoptimized className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-xl font-bold">{name.charAt(0).toUpperCase()}</span>
              )}
              <div className="text-left leading-tight">
                <p className="text-sm text-neutral-300">Bienvenido</p>
                <p className="mt-1 max-w-[200px] truncate text-lg font-bold text-white">{name}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/vote/2026" className="rounded-xl bg-[#a100ff] px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Ir a votar</Link>
              {admin && <Link href="/admin" className="rounded-xl border border-[#eed5a0]/50 bg-black/50 px-5 py-3 font-semibold text-[#eed5a0]">Administraci?n</Link>}
              <form action="/auth/logout" method="post">
                <button className="rounded-xl bg-neutral-800 px-5 py-3 text-white transition-colors hover:bg-white/15">Salir</button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}


