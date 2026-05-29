import type { RiskQuestion, RiskTierDefinition } from '@/types'

export const RISK_TIER_DEFINITIONS: RiskTierDefinition[] = [
  {
    tier: 'LOW',
    minScore: 5,
    maxScore: 12,
    label: 'Conservative',
    description: 'You prefer capital protection over high returns. Suitable for stable, low-risk instruments.',
    color: 'green',
  },
  {
    tier: 'MEDIUM',
    minScore: 13,
    maxScore: 19,
    label: 'Moderate',
    description: 'You are comfortable with some market fluctuation for better long-term returns.',
    color: 'amber',
  },
  {
    tier: 'HIGH',
    minScore: 20,
    maxScore: 25,
    label: 'Aggressive',
    description: 'You seek maximum growth and can tolerate significant short-term volatility.',
    color: 'red',
  },
]

export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id: 'q1',
    text: 'How would you react if your investment portfolio dropped 20% in value over 3 months?',
    options: [
      { id: 'q1a', text: 'I would sell everything immediately to prevent further loss', score: 1 },
      { id: 'q1b', text: 'I would be very concerned and move to safer investments', score: 2 },
      { id: 'q1c', text: 'I would wait and see before making any decision', score: 3 },
      { id: 'q1d', text: 'I would hold on, expecting recovery', score: 4 },
      { id: 'q1e', text: 'I would invest more to take advantage of lower prices', score: 5 },
    ],
  },
  {
    id: 'q2',
    text: 'What is your primary investment objective?',
    options: [
      { id: 'q2a', text: 'Preserve my capital at all costs', score: 1 },
      { id: 'q2b', text: 'Generate steady income with minimal risk', score: 2 },
      { id: 'q2c', text: 'Balance between income and growth', score: 3 },
      { id: 'q2d', text: 'Grow my wealth significantly over time', score: 4 },
      { id: 'q2e', text: 'Maximise returns, willing to take high risk', score: 5 },
    ],
  },
  {
    id: 'q3',
    text: 'How long is your investment horizon for your primary goal?',
    options: [
      { id: 'q3a', text: 'Less than 1 year', score: 1 },
      { id: 'q3b', text: '1 to 3 years', score: 2 },
      { id: 'q3c', text: '3 to 5 years', score: 3 },
      { id: 'q3d', text: '5 to 10 years', score: 4 },
      { id: 'q3e', text: 'More than 10 years', score: 5 },
    ],
  },
  {
    id: 'q4',
    text: 'What percentage of your monthly income can you set aside for investments without affecting your lifestyle?',
    options: [
      { id: 'q4a', text: 'Less than 5%', score: 1 },
      { id: 'q4b', text: '5% to 10%', score: 2 },
      { id: 'q4c', text: '10% to 20%', score: 3 },
      { id: 'q4d', text: '20% to 30%', score: 4 },
      { id: 'q4e', text: 'More than 30%', score: 5 },
    ],
  },
  {
    id: 'q5',
    text: 'How stable is your income source?',
    options: [
      { id: 'q5a', text: 'Very unstable — freelance/irregular', score: 1 },
      { id: 'q5b', text: 'Somewhat unstable — contract/variable', score: 2 },
      { id: 'q5c', text: 'Moderate — business owner with some variability', score: 3 },
      { id: 'q5d', text: 'Stable — salaried with occasional bonuses', score: 4 },
      { id: 'q5e', text: 'Very stable — government/tenured job', score: 5 },
    ],
  },
]
