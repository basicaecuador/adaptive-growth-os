import { getAnthropicClient, DEFAULT_MODEL } from '../client'
import {
  buildExtractRulesPrompt,
  type ExtractRulesInput,
  type ExtractRulesOutput,
} from '../prompts/feedback/extract-rules'

export async function extractRulesFromFeedback(
  input: ExtractRulesInput,
): Promise<ExtractRulesOutput> {
  const client = getAnthropicClient()
  const prompt = buildExtractRulesPrompt(input)

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '{"rules":[]}'
  return JSON.parse(text) as ExtractRulesOutput
}
