'use client'

import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function SettingsPage() {
  const router = useRouter()
  const resetProfile = useUserStore(s => s.resetProfile)
  const userGoals = useGoalsStore(s => s.userGoals)
  const resetGoals = useGoalsStore(s => s.resetGoals)
  const products = useProductsStore(s => s.products)
  const clearRecommendation = useRecommendationStore(s => s.clear)

  function exportData() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: useUserStore.getState(),
      goals: useGoalsStore.getState().userGoals,
      products: useProductsStore.getState().products,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ujjivan-financial-plan-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetAll() {
    if (!confirm('This will delete all your data. Are you sure?')) return
    resetProfile()
    resetGoals()
    clearRecommendation()
    localStorage.clear()
    router.push('/onboarding')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your data and preferences</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Data summary */}
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-900">{userGoals.length}</p>
              <p className="text-xs text-slate-500">Goals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              <p className="text-xs text-slate-500">Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{products.filter(p => p.isActive).length}</p>
              <p className="text-xs text-slate-500">Active Products</p>
            </div>
          </div>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download a JSON backup of all your financial planning data</CardDescription>
          </CardHeader>
          <Button variant="secondary" onClick={exportData}>Download JSON Backup</Button>
        </Card>

        {/* Edit profile */}
        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Re-run the onboarding wizard to update your personal and financial details</CardDescription>
          </CardHeader>
          <Button variant="secondary" onClick={() => router.push('/onboarding')}>Edit Profile</Button>
        </Card>

        {/* Reset */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Reset All Data</CardTitle>
            <CardDescription>Permanently delete all your data and start fresh. This cannot be undone.</CardDescription>
          </CardHeader>
          <Button variant="danger" onClick={resetAll}>Reset Everything</Button>
        </Card>
      </div>
    </div>
  )
}
