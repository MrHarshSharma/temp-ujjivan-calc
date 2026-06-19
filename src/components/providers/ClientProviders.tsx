'use client'

import { usePersistence } from '@/hooks/usePersistence'
import { useProductSync } from '@/hooks/useProductSync'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  usePersistence()
  useProductSync()
  return <>{children}</>
}
