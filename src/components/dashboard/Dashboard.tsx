'use client'

import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCalculations } from '@/hooks/useCalculations'
import { Card, CardHeader, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import { CashflowSummaryCard } from './CashflowSummaryCard'
import { WealthProjectionChart } from './WealthProjectionChart'
import { GoalTimelineCard } from './GoalTimelineCard'
import { TalkingPointsPanel } from './TalkingPointsPanel'
import { TimelineStoryCard } from './TimelineStoryCard'
import { ScenarioSliders } from './ScenarioSliders'
import { generateTalkingPoints } from '@/engine/talkingPoints.engine'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { formatCurrency, formatPercent } from '@/utils/format.utils'

export function Dashboard() {
  const router = useRouter()
  const profile = useUserStore(s => s.profile)
  const isOnboardingComplete = useUserStore(s => s.isOnboardingComplete)
  const userGoals = useGoalsStore(s => s.userGoals)
  const recommendation = useRecommendationStore(s => s.recommendation)
  const { cashflow, goalAnalyses, projection } = useCalculations()

  if (!isOnboardingComplete || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Ujjivan Financial Planning Tool</h1>
        <p className="text-slate-500 text-center max-w-md">
          Set up your financial profile to start planning your goals and getting personalised recommendations.
        </p>
        <Button onClick={() => router.push('/onboarding')} size="lg">Get Started →</Button>
      </div>
    )
  }

  const netWorth = profile.financial.existingInvestments.reduce((s, inv) => s + inv.currentValue, 0)
  const talkingPoints = generateTalkingPoints(profile, userGoals, goalAnalyses, recommendation)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {profile.personal.name}&apos;s Financial Plan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Age {profile.personal.age} · <RiskBadge tier={profile.riskProfile.tier} /> · {userGoals.length} goal{userGoals.length !== 1 ? 's' : ''}
        </p>
      </div>


      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardDescription>Monthly Income</CardDescription></CardHeader>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(profile.financial.monthlyIncome)}</p>
        </Card>
        <Card>
          <CardHeader><CardDescription>Monthly Surplus</CardDescription></CardHeader>
          <p className={`text-xl font-bold ${(cashflow?.monthlySurplus ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashflow ? formatCurrency(cashflow.monthlySurplus) : '—'}
          </p>
        </Card>
        <Card>
          <CardHeader><CardDescription>Savings Rate</CardDescription></CardHeader>
          <p className="text-xl font-bold text-blue-600">
            {cashflow ? formatPercent(cashflow.savingsRate) : '—'}
          </p>
        </Card>
        <Card>
          <CardHeader><CardDescription>Current Net Worth</CardDescription></CardHeader>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(netWorth)}</p>
        </Card>
      </div>

      {/* Charts + Goal Timeline — collapsible */}
      <CollapsibleSection title="Cashflow, Projection & Goal Timeline" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cashflow && <CashflowSummaryCard cashflow={cashflow} />}
          {projection.length > 0 && <WealthProjectionChart data={projection} />}
        </div>
        {userGoals.length > 0 && (
          <div className="mt-4">
            <GoalTimelineCard goals={userGoals} analyses={goalAnalyses} />
          </div>
        )}
      </CollapsibleSection>

      {/* Manager Talking Points */}
      {talkingPoints.length > 0 && (
        <TalkingPointsPanel points={talkingPoints} />
      )}

      {/* Timeline Story */}
      {userGoals.length > 0 && goalAnalyses.length > 0 && (
        <TimelineStoryCard
          goals={userGoals}
          analyses={goalAnalyses}
          currentAge={profile.personal.age}
        />
      )}

      {/* What-If Scenario Sliders */}
      <ScenarioSliders />

      {/* Quick actions */}
      <div className="flex gap-3 pb-4">
        <Button variant="secondary" onClick={() => router.push('/goals')}>Manage Goals</Button>
        <Button variant="secondary" onClick={() => router.push('/recommendations')}>View Recommendations</Button>
      </div>
    </div>
  )
}
