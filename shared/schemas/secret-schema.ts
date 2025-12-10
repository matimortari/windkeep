import { z } from "zod"

export const createSecretSchema = z.object({
  key: z
    .string()
    .min(1, "Secret key is required")
    .max(50, "Secret key must be at most 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Secret key must contain only uppercase letters, numbers, and underscores")
    .transform(val => val.trim()),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .transform(val => val.trim())
    .optional(),
  projectId: z.cuid(),
  values: z
    .array(
      z.object({
        environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
        value: z.string().min(1, "Secret value is required"),
      }),
    )
    .optional(),
})

export const updateSecretSchema = z.object({
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .transform(val => val.trim())
    .optional()
    .nullable(),
  values: z
    .array(
      z.object({
        environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
        value: z.string().min(1, "Secret value is required"),
      }),
    )
    .optional(),
})

export const createSecretValueSchema = z.object({
  secretId: z.cuid(),
  environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  value: z.string().min(1, "Secret value is required"),
})

export const updateSecretValueSchema = z.object({
  value: z.string().min(1, "Secret value is required"),
})

export type CreateSecretInput = z.infer<typeof createSecretSchema>
export type UpdateSecretInput = z.infer<typeof updateSecretSchema>
export type CreateSecretValueInput = z.infer<typeof createSecretValueSchema>
export type UpdateSecretValueInput = z.infer<typeof updateSecretValueSchema>
