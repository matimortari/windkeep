import { z } from "zod"

export const createOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters"),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().transform(v => v || undefined).pipe(z.string().url("Website must be a valid URL").max(255, "Website URL must be at most 255 characters").optional()),
})

export const updateOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters").optional(),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().transform(v => v || undefined).pipe(z.string().url("Website must be a valid URL").max(255, "Website URL must be at most 255 characters").optional()),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
})

export const createInviteSchema = z.object({
  orgId: z.cuid(),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invitation token is required").transform(val => val.trim()),
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
