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

/**
 * Historical XIRR performance for a product (F-07).
 * Values are % to 1 decimal. `null` = not available / not applicable
 * (e.g. protection products show "N/A — protection product").
 */
export interface ProductReturnHistory {
  xirr3yr: number | null
  xirr5yr: number | null
  xirr10yr: number | null
  /** Data-as-of label, e.g. "2026-03" — always shown next to XIRR to flag stale data. */
  asOf: string | null
}

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
  // ─── F-02 Honest coverage mapping ──
  /** true = real Ujjivan offering; false = third-party "Other market option" (carries disclosure). */
  isUjjivanProduct: boolean
  /** One-line RM pitch read to the client. */
  rmPitch: string
  /** Priority rank within category — lower = shown first (admin/campaign controlled, F-12). */
  priorityRank: number
  // ─── F-03 Deep dive (recommended vs alternate) ──
  /** 2–3 short pros, pre-authored for the deep-dive card. */
  pros: string[]
  /** 2–3 short cons, pre-authored for the deep-dive card. */
  cons: string[]
  /** Default alternate product to show alongside this one. Falls back to next-ranked in category. */
  alternateProductId?: string
  /** Account-opening deep link (Ujjivan) or external "Learn more" page (third-party). */
  ctaLink?: string
  // ─── F-07 Historical XIRR ──
  returnHistory: ProductReturnHistory
  /** Investment term range in months, where applicable (FDs, lock-ins). */
  termRangeMonths?: { min: number; max: number }
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

// ─── Commitment (F-04) ────────────────────────────────────────────────────────

export type GoalActivationStatus = 'ACTIVATED' | 'DEFERRED'

export interface GoalCommitment {
  goalId: string
  status: GoalActivationStatus
  /** SIP the client actually commits to for this goal (after any lumpsum reduction). */
  committedMonthlySIP: number
  /** SIP originally recommended by the plan — kept for committed-vs-recommended in the report. */
  recommendedMonthlySIP: number
}

export interface CommitmentRecord {
  /** Total monthly SIP the client commits to now. */
  monthlySIPCommitment: number
  /** Optional lumpsum deployed today. */
  lumpsum: number
  goals: GoalCommitment[]
  status: 'PENDING' | 'COMMITTED' | 'DEFERRED_ALL'
  committedAt: string | null
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
