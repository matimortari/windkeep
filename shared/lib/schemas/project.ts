import { z } from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  organizationId: z.cuid(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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
