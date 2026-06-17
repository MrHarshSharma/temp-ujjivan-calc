'use client'

import { useRef, useState, useEffect } from 'react'
import { useChatStore, type ChatMode } from '@/store/chatStore'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCalculations } from '@/hooks/useCalculations'
import { buildChatContext } from '@/engine/chatContext'

const MODES: { value: ChatMode; label: string }[] = [
  { value: 'RM', label: 'RM' },
  { value: 'CLIENT', label: 'Client' },
]

const SUGGESTIONS = [
  'Why is the SIP for this goal so high?',
  'Explain an index fund in simple terms',
  'What if the client misses 3 months of SIP?',
]

export function ChatPanel() {
  const { isOpen, mode, messages, isSending, toggleOpen, setMode, addMessage, setSending, clear } = useChatStore()
  const profile = useUserStore(s => s.profile)
  const goals = useGoalsStore(s => s.userGoals)
  const products = useProductsStore(s => s.products)
  const recommendation = useRecommendationStore(s => s.recommendation)
  const { goalAnalyses } = useCalculations()

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isSending) return
    setInput('')
    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }]
    addMessage({ role: 'user', content: trimmed })
    setSending(true)
    try {
      const context = buildChatContext(profile, goals, goalAnalyses, recommendation, products)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, mode, context }),
      })
      const data = await res.json()
      addMessage({ role: 'assistant', content: res.ok ? data.text : `⚠️ ${data.error ?? 'Something went wrong.'}` })
    } catch {
      addMessage({ role: 'assistant', content: '⚠️ Could not reach the assistant. Check your connection.' })
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-600 text-white px-4 py-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open assistant"
      >
        <span className="text-base">💬</span>
        <span className="text-sm font-semibold">Assistant</span>
      </button>
    )
  }

  return (
    <div className="fixed top-0 right-0 z-40 h-screen w-full sm:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-900">Planning Assistant</p>
          <p className="text-[11px] text-slate-400">Context-aware · {profile?.personal.name ?? 'no client loaded'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            {MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`px-2.5 py-1 font-medium transition-colors ${mode === m.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button onClick={toggleOpen} className="text-slate-400 hover:text-slate-700 px-1" aria-label="Close assistant">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-6 space-y-3">
            <p>Ask anything about this client&apos;s plan.</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-xs text-blue-600 hover:underline">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 rounded-2xl px-3 py-2 text-sm">…</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3">
        {messages.length > 0 && (
          <button onClick={clear} className="text-[11px] text-slate-400 hover:text-slate-600 mb-2">Clear conversation</button>
        )}
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder={`Ask in ${mode === 'CLIENT' ? 'client' : 'RM'} mode…`}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-h-28"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
