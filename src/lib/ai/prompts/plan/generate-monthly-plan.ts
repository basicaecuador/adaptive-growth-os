import { buildSystemBase } from '../_shared/system-base'
import { JSON_FORMAT_INSTRUCTION } from '../_shared/format-rules'
import type { Brand, BrandSetup, ContentType, ContentPlatform } from '@/types/domain'

export interface MonthlyPlanInput {
  brand: Brand
  setup: BrandSetup
  month: number
  year: number
  postsPerWeek: number
  platforms: ContentPlatform[]
  contentTypes: ContentType[]
}

export interface MonthlyPlanItemOutput {
  week: number
  type: ContentType
  platform: ContentPlatform
  topic: string
  pillar: string
  notes: string
}

export interface MonthlyPlanOutput {
  month: number
  year: number
  items: MonthlyPlanItemOutput[]
}

export function buildMonthlyPlanPrompt(input: MonthlyPlanInput): string {
  const pillars = input.setup.contentPillars.join('\n- ')

  return `${buildSystemBase({
    name: input.brand.name,
    voice: input.setup.voice,
    tone: input.setup.tone,
    targetAudience: input.setup.targetAudience,
    valueProposition: input.setup.valueProposition,
  })}

TASK: Generate a monthly content plan for ${input.brand.name}
PERIOD: Month ${input.month}, ${input.year}
PLATFORMS: ${input.platforms.join(', ')}
FREQUENCY: ${input.postsPerWeek} posts per week
CONTENT PILLARS:
- ${pillars}

Distribute topics evenly across pillars. Vary content types throughout the month.

Return JSON:
{
  "month": ${input.month},
  "year": ${input.year},
  "items": [
    {
      "week": 1,
      "type": "post|story|reel|carousel|caption",
      "platform": "instagram|facebook|twitter|linkedin|tiktok",
      "topic": "specific topic for this piece",
      "pillar": "which content pillar",
      "notes": "brief creative direction"
    }
  ]
}

${JSON_FORMAT_INSTRUCTION}`
}
