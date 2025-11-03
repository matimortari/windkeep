import { z } from "zod"

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 2, { message: "Organization name cannot be empty or only whitespace" }),
})

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 2, { message: "Organization name cannot be empty or only whitespace" })
    .optional(),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export const createInviteSchema = z.object({
  email: z.email("Invalid email address").transform(val => val.trim().toLowerCase()),
  organizationId: z.cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional().default("MEMBER"),
})

export const acceptInviteSchema = z.object({
  token: z
    .string()
    .min(1, "Invitation token is required")
    .transform(val => val.trim()),
})

export type CreateOrgInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrgInput = z.infer<typeof updateOrganizationSchema>
export type UpdateOrgMemberInput = z.infer<typeof updateMemberRoleSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
