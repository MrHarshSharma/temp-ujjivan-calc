'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { TalkingPoint, PointSeverity } from '@/engine/talkingPoints.engine'

const severityConfig: Record<PointSeverity, { bg: string; border: string; label: string; chevron: string; filterActive: string; filterInactive: string }> = {
  action:   { bg: 'bg-red-50',   border: 'border-red-200',   label: 'Action Required', chevron: 'text-red-400',   filterActive: 'bg-red-100 text-red-700 border-red-300',     filterInactive: 'bg-red-50 text-red-400 border-red-200' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', label: 'Discuss',         chevron: 'text-amber-400', filterActive: 'bg-amber-100 text-amber-700 border-amber-300', filterInactive: 'bg-amber-50 text-amber-400 border-amber-200' },
  info:     { bg: 'bg-blue-50',  border: 'border-blue-200',  label: 'Note',            chevron: 'text-blue-400',  filterActive: 'bg-blue-100 text-blue-700 border-blue-300',   filterInactive: 'bg-blue-50 text-blue-400 border-blue-200' },
  positive: { bg: 'bg-green-50', border: 'border-green-200', label: 'Positive',        chevron: 'text-green-400', filterActive: 'bg-green-100 text-green-700 border-green-300', filterInactive: 'bg-green-50 text-green-400 border-green-200' },
}

function TalkingPointItem({ point }: { point: TalkingPoint }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = severityConfig[point.severity]

  return (
    <div
      className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 cursor-pointer select-none`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{point.headline}</p>
        <span className={`text-xs shrink-0 ${cfg.chevron}`}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{point.detail}</p>
      )}
    </div>
  )
}

export function TalkingPointsPanel({ points }: { points: TalkingPoint[] }) {
  const [filter, setFilter] = useState<PointSeverity | 'all'>('all')

  const order: PointSeverity[] = ['action', 'warning', 'info', 'positive']
  const sorted = [...points].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
  const filtered = filter === 'all' ? sorted : sorted.filter(p => p.severity === filter)

  const counts = {
    action: points.filter(p => p.severity === 'action').length,
    warning: points.filter(p => p.severity === 'warning').length,
    info: points.filter(p => p.severity === 'info').length,
    positive: points.filter(p => p.severity === 'positive').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Manager&apos;s Talking Points</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Key conversation starters for your meeting with the customer</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
            {points.length} point{points.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['all', 'action', 'warning', 'info', 'positive'] as (PointSeverity | 'all')[]).map(key => {
          const label = key === 'all' ? 'All' : severityConfig[key].label
          const count = key === 'all' ? null : counts[key]
          const isActive = filter === key
          const activeClass = key === 'all'
            ? 'bg-slate-800 text-white border-slate-800'
            : severityConfig[key].filterActive
          const inactiveClass = key === 'all'
            ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            : severityConfig[key].filterInactive
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                ${isActive ? activeClass : inactiveClass}`}
            >
              {label}{count !== null ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No points in this category</p>
        )}
        {filtered.map(p => <TalkingPointItem key={p.id} point={p} />)}
      </div>
    </Card>
  )
}
