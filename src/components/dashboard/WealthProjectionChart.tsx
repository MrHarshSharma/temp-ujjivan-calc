'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ProjectionDataPoint } from '@/types'
import { formatCurrency } from '@/utils/format.utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts'

export function WealthProjectionChart({ data }: { data: ProjectionDataPoint[] }) {
  const milestoneYears = data.filter(d => d.goalsMilestones.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wealth Projection</CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">Portfolio value over time (estimated)</p>
      </CardHeader>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} width={60} />
            <Tooltip
              formatter={(v) => [formatCurrency(Number(v), false), 'Portfolio Value']}
              labelFormatter={label => `Year ${label}`}
            />
            {milestoneYears.map(d => (
              <ReferenceLine
                key={d.year}
                x={d.year}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: d.goalsMilestones[0]?.substring(0, 8), fontSize: 9, fill: '#f59e0b' }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
