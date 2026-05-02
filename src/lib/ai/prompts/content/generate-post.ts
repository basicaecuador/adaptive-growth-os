import { buildSystemBase } from '../_shared/system-base'
import { JSON_FORMAT_INSTRUCTION, CONTENT_LENGTH_GUIDELINES } from '../_shared/format-rules'
import { buildRuleContext } from '@/lib/rules/engine'
import type { ContentGenerationInput } from '@/types/domain'

export function buildGeneratePostPrompt(input: ContentGenerationInput): string {
  const ruleContext = buildRuleContext({ brandId: input.brand.id, rules: input.rules })

  return `${buildSystemBase({
    name: input.brand.name,
    voice: input.setup.voice,
    tone: input.setup.tone,
    targetAudience: input.setup.targetAudience,
    valueProposition: input.setup.valueProposition,
  })}

${ruleContext ? `BRAND RULES:\n${ruleContext}\n` : ''}
TASK: Generate a ${input.type} for ${input.platform}
${input.topic ? `TOPIC: ${input.topic}` : ''}
${input.notes ? `NOTES: ${input.notes}` : ''}

${CONTENT_LENGTH_GUIDELINES}

Return JSON:
{
  "body": "the generated content",
  "suggestions": ["alternative version 1", "alternative version 2"],
  "appliedRules": ["rule id or description that influenced this content"]
}

${JSON_FORMAT_INSTRUCTION}`
}
