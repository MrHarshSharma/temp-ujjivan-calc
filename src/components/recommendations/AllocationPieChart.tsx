'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ProductAllocation, ProductMaster } from '@/types'
import { formatCurrency } from '@/utils/format.utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#f97316', '#10b981']

export function AllocationPieChart({
  allocations,
  products,
  totalMonthly,
}: {
  allocations: ProductAllocation[]
  products: ProductMaster[]
  totalMonthly: number
}) {
  const data = allocations.map(a => ({
    name: products.find(p => p.id === a.productId)?.name ?? a.productId,
    value: a.allocationPercent,
    monthly: a.monthlyAmount,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Portfolio Allocation</CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">Total: {formatCurrency(totalMonthly)}/month</p>
      </CardHeader>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="h-52 w-full md:w-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [`${v}%`, name as string]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-sm text-slate-700 flex-1 truncate">{d.name}</span>
              <span className="text-sm font-semibold text-slate-900 shrink-0">{d.value}%</span>
              <span className="text-xs text-slate-500 shrink-0">{formatCurrency(d.monthly)}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
