import { z } from "zod"

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(50, "Organization name must be at most 50 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 3, { message: "Organization name cannot be empty" }),
})

export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(50, "Organization name must be at most 50 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 3, { message: "Organization name cannot be empty" })
    .optional(),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
})

export const createInviteSchema = z.object({
  orgId: z.cuid(),
})

export const acceptInviteSchema = z.object({
  token: z
    .string()
    .min(1, "Invitation token is required")
    .transform(val => val.trim()),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type UpdateOrgMemberInput = z.infer<typeof updateMemberRoleSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
