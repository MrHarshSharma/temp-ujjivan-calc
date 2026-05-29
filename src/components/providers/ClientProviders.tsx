'use client'

import { usePersistence } from '@/hooks/usePersistence'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  usePersistence()
  return <>{children}</>
}
