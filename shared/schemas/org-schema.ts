import { z } from "zod"

export const createOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Organization name must be at least 3 characters")
    .max(50, "Organization name must be at most 50 characters"),
})

export const updateOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Organization name must be at least 3 characters")
    .max(50, "Organization name must be at most 50 characters")
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

export const transferOwnershipSchema = z.object({
  newOwnerId: z.cuid(),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type UpdateOrgMemberInput = z.infer<typeof updateMemberRoleSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>
