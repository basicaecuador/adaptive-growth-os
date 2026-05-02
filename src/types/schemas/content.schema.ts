import { z } from 'zod'

export const contentTypeSchema = z.enum(['post', 'story', 'reel', 'carousel', 'caption'])
export const contentPlatformSchema = z.enum([
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
])
export const contentStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'published',
])

export const generateContentSchema = z.object({
  brandId: z.string().uuid(),
  planId: z.string().uuid(),
  type: contentTypeSchema,
  platform: contentPlatformSchema,
  topic: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
})

export const approveContentSchema = z.object({
  contentId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'changes_requested']),
  comment: z.string().max(2000).optional(),
})

export const contentPlanSchema = z.object({
  brandId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
})

export const contentGenerationOutputSchema = z.object({
  body: z.string().min(1).max(5000),
  suggestions: z.array(z.string()).max(5),
  appliedRules: z.array(z.string()),
})

export type GenerateContentInput = z.infer<typeof generateContentSchema>
export type ApproveContentInput = z.infer<typeof approveContentSchema>
export type ContentPlanInput = z.infer<typeof contentPlanSchema>
export type ContentGenerationOutputValidated = z.infer<typeof contentGenerationOutputSchema>
