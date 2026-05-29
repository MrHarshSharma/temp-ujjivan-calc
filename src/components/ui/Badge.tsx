import React from 'react'
import type { RiskTier, GoalPriority } from '@/types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  muted: 'bg-slate-50 text-slate-500',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const map: Record<RiskTier, { label: string; variant: BadgeVariant }> = {
    LOW: { label: 'Conservative', variant: 'success' },
    MEDIUM: { label: 'Moderate', variant: 'warning' },
    HIGH: { label: 'Aggressive', variant: 'danger' },
  }
  const { label, variant } = map[tier]
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }: { priority: GoalPriority }) {
  const map: Record<GoalPriority, { variant: BadgeVariant }> = {
    HIGH: { variant: 'danger' },
    MEDIUM: { variant: 'warning' },
    LOW: { variant: 'muted' },
  }
  return <Badge variant={map[priority].variant}>{priority}</Badge>
}
