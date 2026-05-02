export type { Rule, RuleSet, RuleCategory, RuleSource } from '@/types/domain'

export interface RuleEvaluation {
  passed: boolean
  violations: RuleViolation[]
}

export interface RuleViolation {
  ruleId: string
  description: string
  suggestion: string
}
