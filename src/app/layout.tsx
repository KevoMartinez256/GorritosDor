// src/app/layout.tsx
import './globals.css'

export const metadata = { title: 'Gorritos D’or 2026 | 12 de diciembre', description: 'Los premios de la comunidad. Gorritos D’or 2026, este 12 de diciembre.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black" suppressHydrationWarning>
        {/* Capa de fondo con blur */}
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/gorritos-2026.png')] bg-cover bg-center blur-sm scale-105" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {children}
      </body>
    </html>
  );
}

