import type { AgeGroup, RiskTier } from '@/types'

export interface AgeGroupDefinition {
  group: AgeGroup
  label: string
  minAge: number
  maxAge: number
  defaultRiskSuggestion: RiskTier
  description: string
}

export const AGE_GROUP_DEFINITIONS: AgeGroupDefinition[] = [
  {
    group: '20_30',
    label: '20 – 30 years',
    minAge: 20,
    maxAge: 29,
    defaultRiskSuggestion: 'HIGH',
    description: 'Long investment horizon. Can absorb high risk for maximum wealth creation.',
  },
  {
    group: '30_40',
    label: '30 – 40 years',
    minAge: 30,
    maxAge: 39,
    defaultRiskSuggestion: 'HIGH',
    description: 'Still good runway. Focus on equity-heavy portfolio with some debt for stability.',
  },
  {
    group: '40_50',
    label: '40 – 50 years',
    minAge: 40,
    maxAge: 49,
    defaultRiskSuggestion: 'MEDIUM',
    description: 'Begin shifting to balanced allocation. Protect gains while still growing.',
  },
  {
    group: '50_PLUS',
    label: '50+ years',
    minAge: 50,
    maxAge: 100,
    defaultRiskSuggestion: 'LOW',
    description: 'Capital preservation is priority. Move toward debt, FD, and stable income products.',
  },
]
