import { z } from "zod"

const encryptionKeySchema = z.string().trim().min(12, "Encryption password must be at least 12 characters").max(255, "Encryption password must be at most 255 characters")

// Reusable helper for manual encryption key validation
function validateManualEncryptionKey(data: { encryptionMode?: "AUTO" | "MANUAL", encryptionKey?: string }, ctx: z.RefinementCtx) {
  if (data.encryptionMode === "MANUAL") {
    const parsed = encryptionKeySchema.safeParse(data.encryptionKey)
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["encryptionKey"],
        message: parsed.error.issues[0]?.message || "Encryption password is required",
      })
    }
  }
}

export const createOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters"),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().optional().transform(v => v || undefined).pipe(z.url("Website must be a valid URL").max(255, "Website URL must be at most 255 characters").optional()),
  encryptionMode: z.enum(["AUTO", "MANUAL"]).default("AUTO").optional(),
  encryptionKey: z.string().trim().optional(),
}).superRefine(validateManualEncryptionKey)

export const updateOrgSchema = z.object({
  name: z.string().trim().min(3, "Organization name must be at least 3 characters").max(50, "Organization name must be at most 50 characters").optional(),
  description: z.string().trim().max(255, "Description must be at most 255 characters").optional(),
  website: z.string().trim().optional().transform(v => v || undefined).pipe(z.url("Website must be a valid URL").optional()),
  rotateEncryptionKey: z.boolean().optional(),
  encryptionMode: z.enum(["AUTO", "MANUAL"]).optional(),
  encryptionKey: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (data.rotateEncryptionKey) {
    validateManualEncryptionKey(data, ctx)
  }
})

export const getAuditLogsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  userId: z.cuid2().optional(),
  serviceTokenId: z.cuid2().optional(),
  projectId: z.cuid2().optional(),
  action: z.string().min(1).optional(),
}).refine(data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate), { message: "startDate must be before endDate", path: ["endDate"] })

export const updateOrgMemberRoleSchema = z.object({ role: z.enum(["ADMIN", "MEMBER"]) })
export const removeOrgMemberSchema = z.object({ orgId: z.cuid2(), userId: z.cuid2() })
export const createInviteSchema = z.object({ orgId: z.cuid2(), email: z.email("Invalid email address"), role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER") })
export const acceptInviteSchema = z.object({ token: z.string().trim().min(1, "Invitation token is required") })
export const transferOwnershipSchema = z.object({ newOwnerId: z.cuid2() })

export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type UpdateOrgMemberInput = z.infer<typeof updateOrgMemberRoleSchema>
export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>
