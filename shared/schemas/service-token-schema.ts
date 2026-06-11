import { z } from "zod"

export const createServiceTokenSchema = z.object({
  name: z
    .string()
    .min(3, "Token name must be at least 3 characters")
    .max(50, "Token name must be at most 50 characters")
    .transform(val => val.trim()),
  projectId: z.cuid2(),
  environment: z.array(z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"])).min(1, "Token must be assigned to at least one environment"),
  expiresInDays: z.number().int().positive().max(365, "Tokens cannot exceed a 1-year expiration period").optional().nullable(),
})

export const revokeServiceTokenSchema = z.object({ tokenId: z.cuid2() })

export type CreateServiceTokenInput = z.infer<typeof createServiceTokenSchema>
export type RevokeServiceTokenInput = z.infer<typeof revokeServiceTokenSchema>
