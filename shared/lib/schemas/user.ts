import { z } from "zod"

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.url().optional(),
  activeOrgId: z.cuid().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100),
  image: z.url().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
