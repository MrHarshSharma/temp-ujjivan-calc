'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { CashflowSummary } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/format.utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function CashflowSummaryCard({ cashflow }: { cashflow: CashflowSummary }) {
  const data = [
    { name: 'Income', value: cashflow.monthlyIncome, color: '#2563eb' },
    { name: 'Expenses', value: cashflow.monthlyExpenses, color: '#ef4444' },
    { name: 'Goals', value: cashflow.monthlyGoalContributions, color: '#f59e0b' },
    { name: 'Surplus', value: Math.max(0, cashflow.monthlySurplus), color: '#16a34a' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Cashflow</CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">Savings rate: {formatPercent(cashflow.savingsRate)}</p>
      </CardHeader>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} width={60} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v), false), '']} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-500">{d.name}:</span>
            <span className="text-xs font-semibold text-slate-800">{formatCurrency(d.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
