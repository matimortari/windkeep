import { z } from "zod"

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be at most 50 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 3, { message: "Project name cannot be empty" }),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and can contain hyphens")
    .refine(val => !val.startsWith("-") && !val.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    })
    .refine(val => !val.includes("--"), {
      message: "Slug cannot contain consecutive hyphens",
    })
    .transform(val => val.trim()),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .transform(val => val.trim())
    .optional(),
  orgId: z.cuid(),
})

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be at most 50 characters")
    .transform(val => val.trim())
    .refine(val => val.length >= 3, { message: "Project name cannot be empty" })
    .optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and can contain hyphens")
    .refine(val => !val.startsWith("-") && !val.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    })
    .refine(val => !val.includes("--"), {
      message: "Slug cannot contain consecutive hyphens",
    })
    .transform(val => val.trim())
    .optional(),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .transform(val => val.trim())
    .optional(),
})

export const addProjectMemberSchema = z.object({
  userId: z.cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional().default("MEMBER"),
})

export const updateProjectMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
