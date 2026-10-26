import { adminAccess } from '@/lib/admin'
import './admin.css'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { allowed, status } = await adminAccess()
  if (!allowed) return <main className="admin-shell"><Link href="/" className="admin-brand"><img src="/chaparritaspng.png" alt="Chaparritas" />Gorritos D’or</Link><div className="admin-panel"><p className="admin-eyebrow">ACCESO PRIVADO</p><h1>{status === 401 ? 'Entra con tu cuenta de administrador' : status === 503 ? 'No pudimos verificar el acceso' : 'Esta sección es solo para administradores'}</h1><p>Los resultados y el estudio de publicaciones están reservados al equipo de los premios.</p><a className="admin-button primary" href={status === 401 ? '/auth/login' : '/'}>{status === 401 ? 'Conectar con Twitch' : 'Volver al inicio'}</a></div></main>
  return <main className="admin-shell"><header className="admin-header"><a href="/admin" className="admin-brand"><img src="/chaparritaspng.png" alt="Chaparritas" /><span>Gorritos D’or<small>AWARDS / 2026 · ADMIN</small></span></a><nav><a href="/admin/instagram">Instagram</a><a href="/admin/live">Resultados en vivo</a><Link href="/">Inicio ↗</Link></nav></header>{children}</main>
}
