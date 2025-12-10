import { z } from "zod"

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .transform(val => val.trim())
    .refine(val => val.length > 0, { message: "Name cannot be empty" })
    .optional(),
  image: z
    .union([z.url(), z.literal(""), z.null()])
    .transform(val => (val === "" ? null : val))
    .optional(),
  regenerateApiToken: z.boolean().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
