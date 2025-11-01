import { z } from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and can contain hyphens"),
  description: z.string().max(500).optional(),
  organizationId: z.cuid(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and can contain hyphens").optional(),
  description: z.string().max(500).optional(),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export const addProjectMemberSchema = z.object({
  userId: z.cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional().default("MEMBER"),
})

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>

export const updateProjectMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
})

export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>
