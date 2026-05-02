import { getAnthropicClient, DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from '../client'
import { buildGeneratePostPrompt } from '../prompts/content/generate-post'
import { contentGenerationOutputSchema } from '@/types/schemas/content.schema'
import type { ContentGenerationInput, ContentGenerationOutput } from '@/types/domain'

export async function generateContent(
  input: ContentGenerationInput,
): Promise<ContentGenerationOutput> {
  const client = getAnthropicClient()
  const prompt = buildGeneratePostPrompt(input)

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed: unknown = JSON.parse(text)
  return contentGenerationOutputSchema.parse(parsed)
}
