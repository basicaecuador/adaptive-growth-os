import type { RuleSet, RuleEvaluation } from './types'

// Full implementation in FASE 3 — uses Claude to evaluate content against brand rules
export async function evaluateContent(
  _content: string,
  _ruleSet: RuleSet,
): Promise<RuleEvaluation> {
  return {
    passed: true,
    violations: [],
  }
}
