'use client'

import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { buildProjection } from '@/engine/projection.engine'
import { analyzeAllGoals } from '@/engine/goal.engine'
import { formatCurrency, formatPercent } from '@/utils/format.utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import type { FinancialDetails } from '@/types'

interface ScenarioParams {
  extraMonthlySIP: number
  retirementAgeOffset: number
  hikeOffset: number
}

export function ScenarioSliders() {
  const profile = useUserStore(s => s.profile)
  const userGoals = useGoalsStore(s => s.userGoals)

  const [params, setParams] = useState<ScenarioParams>({
    extraMonthlySIP: 0,
    retirementAgeOffset: 0,
    hikeOffset: 0,
  })

  const scenarioResult = useMemo(() => {
    if (!profile) return null

    const currentYear = new Date().getFullYear()
    const modifiedFinancial: FinancialDetails = {
      ...profile.financial,
      expectedHikePercent: profile.financial.expectedHikePercent + params.hikeOffset,
    }
    const modifiedProfile = {
      ...profile,
      personal: {
        ...profile.personal,
        retirementAge: profile.personal.retirementAge + params.retirementAgeOffset,
      },
      financial: modifiedFinancial,
    }

    const existingMonthly = modifiedFinancial.existingInvestments.reduce(
      (s, i) => s + i.monthlyContribution, 0
    )
    const surplusBeforeGoals = modifiedFinancial.monthlyIncome - modifiedFinancial.monthlyExpenses - existingMonthly

    const analyses = analyzeAllGoals(userGoals, modifiedFinancial, currentYear, surplusBeforeGoals, 12)
    const baseMonthlyInvestment = analyses.reduce((s, a) => s + Math.max(0, a.requiredMonthlyContribution), 0)

    const baseProjection = buildProjection(profile, userGoals, baseMonthlyInvestment, 12)
    const scenarioProjection = buildProjection(
      modifiedProfile,
      userGoals,
      baseMonthlyInvestment + params.extraMonthlySIP,
      12
    )

    const finalBase = baseProjection[baseProjection.length - 1]?.totalValue ?? 0
    const finalScenario = scenarioProjection[scenarioProjection.length - 1]?.totalValue ?? 0
    const difference = finalScenario - finalBase

    // Merge both projections for chart
    const chartData = baseProjection.map((b, i) => ({
      year: b.year,
      age: b.age,
      baseline: Math.round(b.totalValue),
      scenario: Math.round(scenarioProjection[i]?.totalValue ?? b.totalValue),
    }))

    return { chartData, finalBase, finalScenario, difference, analyses }
  }, [profile, userGoals, params])

  if (!profile || !scenarioResult) return null

  const hasChanges = params.extraMonthlySIP !== 0 ||
    params.retirementAgeOffset !== 0 ||
    params.hikeOffset !== 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>What-If Scenarios</CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Adjust the sliders to show the customer how small changes today create big differences tomorrow
        </p>
      </CardHeader>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Extra SIP */}
        <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Extra Monthly SIP</p>
            <p className="text-xs text-slate-400">How much more can the customer invest?</p>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(params.extraMonthlySIP)}</span>
            <span className="text-xs text-slate-400">/ month</span>
          </div>
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={params.extraMonthlySIP}
            onChange={e => setParams(p => ({ ...p, extraMonthlySIP: Number(e.target.value) }))}
            className="w-full accent-blue-600 h-1.5"
          />
          <div className="flex justify-between text-xs text-slate-400 -mt-1">
            <span>₹0</span><span>₹50K</span>
          </div>
        </div>

        {/* Retirement age */}
        <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Retire Later By</p>
            <p className="text-xs text-slate-400">More years = more time for corpus to grow</p>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600">
              Age {profile.personal.retirementAge + params.retirementAgeOffset}
            </span>
            {params.retirementAgeOffset > 0 && (
              <span className="text-xs text-green-600 font-medium">+{params.retirementAgeOffset} yrs</span>
            )}
            {params.retirementAgeOffset === 0 && (
              <span className="text-xs text-slate-400">no change</span>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={params.retirementAgeOffset}
            onChange={e => setParams(p => ({ ...p, retirementAgeOffset: Number(e.target.value) }))}
            className="w-full accent-blue-600 h-1.5"
          />
          <div className="flex justify-between text-xs text-slate-400 -mt-1">
            <span>No change</span><span>+10 yrs</span>
          </div>
        </div>

        {/* Hike offset */}
        <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Additional Annual Hike</p>
            <p className="text-xs text-slate-400">On top of current {formatPercent(profile.financial.expectedHikePercent)} expected hike</p>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600">
              {params.hikeOffset === 0 ? 'No change' : `+${formatPercent(params.hikeOffset)}`}
            </span>
            {params.hikeOffset > 0 && (
              <span className="text-xs text-green-600 font-medium">
                → {formatPercent(profile.financial.expectedHikePercent + params.hikeOffset)} total
              </span>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={params.hikeOffset}
            onChange={e => setParams(p => ({ ...p, hikeOffset: Number(e.target.value) }))}
            className="w-full accent-blue-600 h-1.5"
          />
          <div className="flex justify-between text-xs text-slate-400 -mt-1">
            <span>No change</span><span>+10%</span>
          </div>
        </div>
      </div>

      {/* Impact summary */}
      {hasChanges && (
        <div className={`rounded-lg p-4 mb-5 flex items-start gap-3
          ${scenarioResult.difference >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${scenarioResult.difference >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-4 h-4 ${scenarioResult.difference >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={scenarioResult.difference >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} />
              </svg>
            </div>
          <div>
            <p className={`text-sm font-bold ${scenarioResult.difference >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {scenarioResult.difference >= 0
                ? `These changes add ${formatCurrency(scenarioResult.difference)} to the final corpus`
                : `These changes reduce the final corpus by ${formatCurrency(Math.abs(scenarioResult.difference))}`}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Baseline corpus: {formatCurrency(scenarioResult.finalBase)} →
              Scenario corpus: <strong>{formatCurrency(scenarioResult.finalScenario)}</strong>
            </p>
          </div>
          <button
            onClick={() => setParams({ extraMonthlySIP: 0, retirementAgeOffset: 0, hikeOffset: 0 })}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={scenarioResult.chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} width={60} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(Number(v), false), name === 'baseline' ? 'Current Plan' : 'With Changes']}
              labelFormatter={label => `Year ${label}`}
            />
            <Legend formatter={v => v === 'baseline' ? 'Current Plan' : 'With Changes'} />
            <Area type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} fill="url(#baseGradient)" strokeDasharray="4 2" />
            <Area type="monotone" dataKey="scenario" stroke="#2563eb" strokeWidth={2} fill="url(#scenarioGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
