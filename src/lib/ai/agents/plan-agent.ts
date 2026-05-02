import { getAnthropicClient, DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from '../client'
import {
  buildMonthlyPlanPrompt,
  type MonthlyPlanInput,
  type MonthlyPlanOutput,
} from '../prompts/plan/generate-monthly-plan'

export async function generateMonthlyPlan(input: MonthlyPlanInput): Promise<MonthlyPlanOutput> {
  const client = getAnthropicClient()
  const prompt = buildMonthlyPlanPrompt(input)

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text) as MonthlyPlanOutput
}
