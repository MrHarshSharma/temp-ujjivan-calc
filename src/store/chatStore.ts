'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type ChatMode = 'RM' | 'CLIENT'
export interface ChatMessage { role: 'user' | 'assistant'; content: string }

// F-10: session-scoped chat state. Intentionally NOT persisted to localStorage —
// conversation lives for the duration of the session only.
interface ChatStore {
  isOpen: boolean
  mode: ChatMode
  messages: ChatMessage[]
  isSending: boolean
  toggleOpen: () => void
  setMode: (mode: ChatMode) => void
  addMessage: (m: ChatMessage) => void
  setSending: (v: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatStore>()(
  immer((set) => ({
    isOpen: false,
    mode: 'RM',
    messages: [],
    isSending: false,
    toggleOpen: () => set((s) => { s.isOpen = !s.isOpen }),
    setMode: (mode) => set((s) => { s.mode = mode }),
    addMessage: (m) => set((s) => { s.messages.push(m) }),
    setSending: (v) => set((s) => { s.isSending = v }),
    clear: () => set((s) => { s.messages = [] }),
  }))
)
