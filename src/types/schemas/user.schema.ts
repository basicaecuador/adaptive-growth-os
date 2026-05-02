import { z } from 'zod'

export const userRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer'])

export const inviteMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role: userRoleSchema,
  organizationId: z.string().uuid(),
})

export const updateMemberRoleSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: userRoleSchema,
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
