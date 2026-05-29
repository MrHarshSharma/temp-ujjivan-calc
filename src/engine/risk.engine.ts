import type { RiskAnswer, RiskTier, RiskTierDefinition } from '@/types'
import { RISK_TIER_DEFINITIONS } from '@/constants/risk.constants'

/** Sum scores from questionnaire answers */
export function scoreQuestionnaire(answers: RiskAnswer[]): number {
  return answers.reduce((sum, a) => sum + a.score, 0)
}

/** Map total score to a RiskTier */
export function resolveRiskTier(
  totalScore: number,
  tierDefinitions: RiskTierDefinition[] = RISK_TIER_DEFINITIONS
): RiskTier {
  for (const def of tierDefinitions) {
    if (totalScore >= def.minScore && totalScore <= def.maxScore) {
      return def.tier
    }
  }
  // Fallback: clamp to boundaries
  if (totalScore < tierDefinitions[0].minScore) return tierDefinitions[0].tier
  return tierDefinitions[tierDefinitions.length - 1].tier
}

/**
 * Apply the risk-priority rule:
 * Risk category can ONLY downgrade aggressiveness, never upgrade silently.
 *
 * Age group suggests a tier; user's actual risk tier may be more conservative.
 * → Always use the more conservative of the two.
 * → If age group suggests HIGH and user is LOW → use LOW (override).
 * → If age group suggests LOW and user is HIGH → use HIGH (respect user, but warn).
 */
export function applyRiskPriorityRule(
  ageGroupSuggestion: RiskTier,
  userRiskTier: RiskTier
): { effectiveTier: RiskTier; wasOverridden: boolean } {
  const tierOrder: Record<RiskTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }

  const ageLevel = tierOrder[ageGroupSuggestion]
  const userLevel = tierOrder[userRiskTier]

  // User is more conservative than age group suggests → downgrade
  if (userLevel < ageLevel) {
    return { effectiveTier: userRiskTier, wasOverridden: true }
  }

  // User is more aggressive than age group suggests → respect age group suggestion
  // (don't silently upgrade to user's higher risk beyond age-appropriate)
  if (userLevel > ageLevel) {
    return { effectiveTier: ageGroupSuggestion, wasOverridden: false }
  }

  return { effectiveTier: userRiskTier, wasOverridden: false }
}

/** Check whether products compatible with a given risk tier include higher-risk products */
export function isRiskCompatible(
  productRiskTier: RiskTier,
  userRiskTier: RiskTier
): boolean {
  const tierOrder: Record<RiskTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }
  return tierOrder[productRiskTier] <= tierOrder[userRiskTier]
}
