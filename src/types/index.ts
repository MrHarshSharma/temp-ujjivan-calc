// ─── Enums & Union Types ────────────────────────────────────────────────────

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskMethod = 'PREDEFINED' | 'QUESTIONNAIRE'

export type AgeGroup = '20_30' | '30_40' | '40_50' | '50_PLUS'

export type GoalCategory =
  | 'RETIREMENT'
  | 'EDUCATION'
  | 'MARRIAGE'
  | 'CHILDS_MARRIAGE'
  | 'OWN_MARRIAGE'
  | 'HOME_PURCHASE'
  | 'REAL_ESTATE'
  | 'VEHICLE'
  | 'TRAVEL'
  | 'EMERGENCY_FUND'
  | 'BUSINESS'
  | 'CHILD_BIRTH'
  | 'MEDICAL_CORPUS'
  | 'LEGACY_INHERITANCE'
  | 'LOAN_FORECLOSURE'
  | 'CRITICAL_ILLNESS'
  | 'LIFE_PROTECTION'
  | 'FAMILY_HEALTH'
  | 'GOLD_PURCHASE'
  | 'SABBATICAL'
  | 'CHARITY'
  | 'CUSTOM'

export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED'

export type ProductCategory =
  | 'MUTUAL_FUND'
  | 'INSURANCE'
  | 'FIXED_DEPOSIT'
  | 'SIP'
  | 'PPF'
  | 'NPS'
  | 'EQUITY'
  | 'GOLD'
  | 'REAL_ESTATE'
  | 'BONDS'
  | 'CUSTOM'

export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW'

// ─── User ───────────────────────────────────────────────────────────────────

export interface PersonalDetails {
  name: string
  age: number
  dateOfBirth?: string
  retirementAge: number
  dependents: number
}

export interface ExistingInvestment {
  id: string
  productId: string
  label: string
  currentValue: number
  monthlyContribution: number
  expectedReturnPercent: number
}

export interface FinancialDetails {
  monthlyIncome: number
  monthlyExpenses: number
  existingInvestments: ExistingInvestment[]
  emergencyFundMonths: number
  expectedHikePercent: number
  inflationPercent: number
  taxBracketPercent: number
}

export interface UserProfile {
  id: string
  personal: PersonalDetails
  financial: FinancialDetails
  riskProfile: RiskProfile
  createdAt: string
  updatedAt: string
}

// ─── Risk ───────────────────────────────────────────────────────────────────

export interface RiskOption {
  id: string
  text: string
  score: number
}

export interface RiskQuestion {
  id: string
  text: string
  options: RiskOption[]
}

export interface RiskAnswer {
  questionId: string
  selectedOptionId: string
  score: number
}

export interface RiskProfile {
  method: RiskMethod
  tier: RiskTier
  questionnaireAnswers?: RiskAnswer[]
  totalScore?: number
  setManuallyAt?: string
}

export interface RiskTierDefinition {
  tier: RiskTier
  minScore: number
  maxScore: number
  label: string
  description: string
  color: string
}

// ─── Goals ──────────────────────────────────────────────────────────────────

export interface GoalTemplate {
  id: string
  name: string
  category: GoalCategory
  description: string
  icon: string
  defaultTargetYears: number
  defaultAmount?: number
  suggestedAgeGroups: AgeGroup[]
}

export interface UserGoal {
  id: string
  templateId?: string
  name: string
  category: GoalCategory
  targetAmount: number
  targetYear: number
  currentSavingsForGoal: number
  priority: GoalPriority
  status: GoalStatus
  notes?: string
  createdAt: string
}

export interface GoalAnalysis {
  goalId: string
  inflationAdjustedTarget: number
  yearsToGoal: number
  requiredMonthlyContribution: number
  lumpSumEquivalent: number
  savingsGap: number
  isAchievable: boolean
  projectedValueAtGoalYear: number
}

// ─── Products ───────────────────────────────────────────────────────────────

export interface ProductMaster {
  id: string
  name: string
  category: ProductCategory
  description: string
  minInvestment: number
  expectedReturnPercent: number
  riskTier: RiskTier
  liquidityScore: number
  taxEfficiency: 'LOW' | 'MEDIUM' | 'HIGH'
  suitableAgeGroups: AgeGroup[]
  suitableGoalCategories: GoalCategory[]
  isActive: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Recommendations ────────────────────────────────────────────────────────

export interface ProductAllocation {
  productId: string
  allocationPercent: number
  monthlyAmount: number
  rationale: string
  isRiskOverride: boolean
}

export interface GoalRecommendation {
  goalId: string
  allocations: ProductAllocation[]
  totalMonthlySIP: number
  recommendedLumpSum?: number
  notes: string[]
}

export interface PortfolioRecommendation {
  userId: string
  generatedAt: string
  ageGroup: AgeGroup
  riskTier: RiskTier
  wasRiskOverridden: boolean
  overallAllocation: ProductAllocation[]
  goalRecommendations: GoalRecommendation[]
  totalMonthlyRequired: number
  availableSurplus: number
  isAffordable: boolean
}

// ─── Calculations ───────────────────────────────────────────────────────────

export interface CashflowSummary {
  monthlyIncome: number
  monthlyExpenses: number
  monthlyGoalContributions: number
  monthlyExistingContributions: number
  monthlySurplus: number
  annualIncome: number
  annualExpenses: number
  savingsRate: number
}

export interface SIPCalculationInput {
  targetAmount: number
  years: number
  expectedReturnPercent: number
  inflationPercent: number
  existingSavings: number
}

export interface SIPCalculationResult {
  requiredMonthlySIP: number
  inflationAdjustedTarget: number
  totalContribution: number
  totalInterestEarned: number
}

export interface ProjectionDataPoint {
  year: number
  age: number
  totalInvestment: number
  totalValue: number
  goalsMilestones: string[]
}
