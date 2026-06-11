import { z } from "zod"

export const getAuditLogsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  userId: z.cuid2().optional(),
  serviceTokenId: z.cuid2().optional(),
  projectId: z.cuid2().optional(),
  action: z.string().min(1).optional(),
}).refine(data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate), { message: "startDate must be before endDate", path: ["endDate"] })

export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>
