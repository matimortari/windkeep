import { z } from "zod"

export const createSecretSchema = z.object({
  key: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  projectId: z.cuid(),
})

export type CreateSecretInput = z.infer<typeof createSecretSchema>

export const updateSecretSchema = z.object({
  description: z.string().max(255).optional(),
})

export type UpdateSecretInput = z.infer<typeof updateSecretSchema>

export const createSecretValueSchema = z.object({
  secretId: z.cuid(),
  environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  value: z.string().min(1),
})

export type CreateSecretValueInput = z.infer<typeof createSecretValueSchema>

export const updateSecretValueSchema = z.object({
  value: z.string().min(1),
})

export type UpdateSecretValueInput = z.infer<typeof updateSecretValueSchema>
