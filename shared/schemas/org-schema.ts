import { z } from "zod"

const encryptionKeySchema = z.string().trim().min(12, "Encryption password must be at least 12 characters").max(255, "Encryption password must be at most 255 characters")

export const createOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters"),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().transform(v => v || undefined).pipe(z.string().url("Website must be a valid URL").max(255, "Website URL must be at most 255 characters").optional()),
  encryptionMode: z.enum(["AUTO", "MANUAL"]).default("AUTO").optional(),
  encryptionKey: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.encryptionMode === "MANUAL") {
    const parsed = encryptionKeySchema.safeParse(data.encryptionKey)
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", path: ["encryptionKey"], message: parsed.error.issues[0]?.message || "Encryption password is required" })
    }
  }
})

export const updateOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters").optional(),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().transform(v => v || undefined).pipe(z.string().url("Website must be a valid URL").max(255, "Website URL must be at most 255 characters").optional()),
  rotateEncryptionKey: z.boolean().optional(),
  encryptionMode: z.enum(["AUTO", "MANUAL"]).optional(),
  encryptionKey: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (!data.rotateEncryptionKey) {
    return
  }

  if (data.encryptionMode === "MANUAL") {
    const parsed = encryptionKeySchema.safeParse(data.encryptionKey)
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", path: ["encryptionKey"], message: parsed.error.issues[0]?.message || "Encryption password is required" })
    }
  }
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
