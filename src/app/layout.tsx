import type { Metadata } from 'next'
import './globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'

export const metadata: Metadata = {
  title: 'Ujjivan Financial Planning Tool',
  description: 'Ujjivan Financial Planning Tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
