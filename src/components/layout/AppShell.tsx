'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ChatPanel />
    </div>
  )
}
