import { z } from "zod"

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .transform(val => val.trim())
    .refine(val => val.length > 0, { message: "Name cannot be empty or only whitespace" })
    .optional(),
  image: z
    .union([z.url(), z.literal(""), z.null()])
    .transform(val => (val === "" ? null : val))
    .optional(),
  activeOrgId: z.cuid().nullable().optional(),
  apiToken: z
    .string()
    .length(32, "API token must be exactly 32 characters")
    .regex(/^[a-f0-9]{32}$/, "API token must be a valid hex string")
    .nullable()
    .optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
