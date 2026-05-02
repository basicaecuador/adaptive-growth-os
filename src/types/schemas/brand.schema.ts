import { z } from 'zod'

export const createBrandSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  organizationId: z.string().uuid(),
})

export const brandSetupSchema = z.object({
  voice: z.string().min(10, 'Describe la voz de la marca').max(500),
  tone: z.string().min(10, 'Describe el tono de la marca').max(500),
  targetAudience: z.string().min(10).max(1000),
  valueProposition: z.string().min(10).max(1000),
  contentPillars: z.array(z.string().min(2).max(100)).min(1).max(8),
  restrictions: z.array(z.string().min(2).max(200)).max(20),
})

export type CreateBrandInput = z.infer<typeof createBrandSchema>
export type BrandSetupInput = z.infer<typeof brandSetupSchema>
