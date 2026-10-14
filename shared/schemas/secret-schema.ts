import { z } from "zod"

const secretTagsSchema = z.array(z.string().trim().min(1, "Tag cannot be empty").max(32, "Tag must be at most 32 characters")).max(10, "A secret can have at most 10 tags").superRefine((tags, ctx) => {
  const seen = new Set<string>()
  for (const [index, tag] of tags.entries()) {
    const key = tag.toLowerCase()
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", path: [index], message: "Tags must be unique" })
    }
    seen.add(key)
  }
})

const secretValuesSchema = z.array(z.object({
  environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  value: z.string().min(1, "Secret value is required").max(1000, "Secret value is too long"),
})).min(1, "At least one environment value is required").max(3, "A secret can have at most one value per environment").superRefine((values, ctx) => {
  const seen = new Set<string>()
  for (const [index, entry] of values.entries()) {
    if (seen.has(entry.environment)) {
      ctx.addIssue({ code: "custom", path: [index, "environment"], message: "Each environment can only appear once" })
    }
    seen.add(entry.environment)
  }
})

export const createSecretSchema = z.object({
  key: z
    .string()
    .min(1, "Secret key is required")
    .max(50, "Secret key must be at most 50 characters")
    .regex(/^[A-Z0-9_]+$/, "Secret key must contain only uppercase letters, numbers, and underscores")
    .refine(val => !val.startsWith("_") && !val.endsWith("_"), { message: "Secret key cannot start or end with an underscore" })
    .refine(val => !val.includes("__"), { message: "Secret key cannot contain consecutive underscores" })
    .transform(val => val.trim()),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .transform(val => val.trim())
    .optional(),
  tags: secretTagsSchema.optional().default([]),
  projectId: z.cuid2(),
  values: secretValuesSchema.optional(),
})

export const updateSecretSchema = z.object({
  description: z.string().max(255, "Description must be at most 255 characters").transform(val => val.trim()).optional().nullable(),
  tags: secretTagsSchema.optional(),
  values: secretValuesSchema.optional(),
})

export const createSecretValueSchema = z.object({
  secretId: z.cuid2(),
  environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  value: z.string().min(1, "Secret value is required").max(1000, "Secret value is too long"),
})

export const updateSecretValueSchema = z.object({ value: z.string().min(1, "Secret value is required").max(1000, "Secret value is too long") })

export type CreateSecretInput = z.infer<typeof createSecretSchema>
export type UpdateSecretInput = z.infer<typeof updateSecretSchema>
export type CreateSecretValueInput = z.infer<typeof createSecretValueSchema>
export type UpdateSecretValueInput = z.infer<typeof updateSecretValueSchema>
