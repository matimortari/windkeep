import { z } from "zod"

export const getAuditLogsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  userId: z.cuid().optional(),
  projectId: z.cuid().optional(),
  action: z.string().min(1).optional(),
})

export const deleteAuditLogsSchema = z.object({
  olderThan: z.iso.datetime().optional(),
  userId: z.cuid().optional(),
  projectId: z.cuid().optional(),
  action: z.string().min(1).optional(),
})

export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>
export type DeleteAuditLogsInput = z.infer<typeof deleteAuditLogsSchema>
