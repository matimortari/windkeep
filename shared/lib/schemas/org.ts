import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

export const createInvitationSchema = z.object({
  email: z.email(),
  organizationId: z.cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
