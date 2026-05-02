import { JSON_FORMAT_INSTRUCTION } from '../_shared/format-rules'
import type { RuleCategory } from '@/types/domain'

export interface ExtractRulesInput {
  brandId: string
  feedback: string
  contentBody: string
}

export interface ExtractedRule {
  category: RuleCategory
  description: string
  instruction: string
}

export interface ExtractRulesOutput {
  rules: ExtractedRule[]
}

export function buildExtractRulesPrompt(input: ExtractRulesInput): string {
  return `You are a content rules extraction system.

TASK: Analyze the feedback provided on a piece of content and extract actionable, reusable brand rules.

CONTENT THAT RECEIVED FEEDBACK:
${input.contentBody}

FEEDBACK:
${input.feedback}

Extract 1-5 rules applicable to future content generation for this brand.
Each rule must be:
1. Specific and actionable — not vague
2. Written as a direct instruction for an AI content generator
3. Categorized as: tone, format, topic, or restriction

Return JSON:
{
  "rules": [
    {
      "category": "tone|format|topic|restriction",
      "description": "Human-readable description",
      "instruction": "Exact instruction to embed in AI prompts"
    }
  ]
}

${JSON_FORMAT_INSTRUCTION}`
}
