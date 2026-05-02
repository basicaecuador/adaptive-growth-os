import type { RuleSet } from './types'

export function buildRuleContext(ruleSet: RuleSet): string {
  const activeRules = ruleSet.rules.filter((r) => r.isActive)
  if (activeRules.length === 0) return ''

  const grouped = activeRules.reduce<Record<string, typeof activeRules>>((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = []
    acc[rule.category].push(rule)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([category, rules]) => {
      const instructions = rules.map((r) => `- ${r.instruction}`).join('\n')
      return `## ${category.toUpperCase()} RULES\n${instructions}`
    })
    .join('\n\n')
}

export function mergeRuleSets(...ruleSets: RuleSet[]): RuleSet {
  if (ruleSets.length === 0) throw new Error('At least one RuleSet is required')
  return {
    brandId: ruleSets[0].brandId,
    rules: ruleSets.flatMap((rs) => rs.rules),
  }
}
