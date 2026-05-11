import { buildSystemBase } from '../_shared/system-base'
import { JSON_FORMAT_INSTRUCTION } from '../_shared/format-rules'
import type { ContentGenerationInput } from '@/types/domain'

export function buildGenerateCaptionPrompt(input: ContentGenerationInput): string {
  return `${buildSystemBase({
    name: input.brand.name,
    descripcion: input.setup.descripcion,
    tonoEstilo: input.setup.tonoEstilo,
    valueProposition: input.setup.valueProposition,
  })}

TASK: Generate a ${input.platform} caption
${input.notes ? `CONTEXT: ${input.notes}` : ''}

Return JSON: { "caption": "string", "hashtags": ["tag1", "tag2"] }

${JSON_FORMAT_INSTRUCTION}`
}
