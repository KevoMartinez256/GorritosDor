'use client'
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="admin-panel"><h1>No se pudo cargar el panel</h1><p>Revisa tu conexión e intenta otra vez.</p><button className="admin-button primary" onClick={reset}>Reintentar</button></div>
}
