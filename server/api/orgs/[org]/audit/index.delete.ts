import { Buffer } from "node:buffer"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import db from "#server/utils/db"
import { getUserFromSession, requireRole } from "#server/utils/helpers"
import { uploadFile } from "#server/utils/storage"
import { deleteAuditLogsSchema } from "#shared/schemas/audit-schema"
import parquet from "parquetjs"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId: org }, ["OWNER"])

  const body = await readBody(event)
  const result = deleteAuditLogsSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const where: any = { orgId: org }
  if (result.data.olderThan) {
    where.createdAt = { lt: new Date(result.data.olderThan) }
  }
  if (result.data.projectId) {
    where.projectId = result.data.projectId
  }
  if (result.data.userId) {
    where.userId = result.data.userId
  }
  if (result.data.action) {
    where.action = { contains: result.data.action, mode: "insensitive" }
  }

  // Limit for memory safety
  const logs = await db.auditLog.findMany({ where, take: 20000, orderBy: { createdAt: "asc" } })
  if (logs.length === 0) {
    return { success: true, message: "No logs found to delete" }
  }

  // Define Parquet schema
  const schema = new parquet.ParquetSchema({
    id: { type: "UTF8" },
    userId: { type: "UTF8", optional: true },
    action: { type: "UTF8" },
    resource: { type: "UTF8", optional: true },
    description: { type: "UTF8", optional: true },
    ip: { type: "UTF8", optional: true },
    ua: { type: "UTF8", optional: true },
    metadata: { type: "UTF8", optional: true },
    createdAt: { type: "TIMESTAMP_MILLIS" },
  })

  // Write logs to a temporary Parquet file before uploading to cold storage
  const tempPath = path.join(os.tmpdir(), `audit_archive_${Date.now()}.parquet`)
  const writer = await parquet.ParquetWriter.openFile(schema, tempPath)
  for (const log of logs) {
    await writer.appendRow({
      id: log.id,
      userId: log.userId ?? null,
      action: log.action,
      resource: log.resource ?? null,
      description: log.description ?? null,
      ip: log.ip ?? null,
      ua: log.ua ?? null,
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
      createdAt: log.createdAt,
    } as any)
  }

  // Read generated parquet file and upload to cold storage
  await writer.close()
  const buffer = await fs.readFile(tempPath)
  const file = new File([Buffer.from(buffer)], `audit_archive_${Date.now()}.parquet`, { type: "application/vnd.apache.parquet" })
  await uploadFile({
    path: `archive/org_${org}`,
    file,
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ["application/vnd.apache.parquet", "application/octet-stream"],
  })

  // Clean up temporary file and delete logs from database
  await fs.unlink(tempPath)
  const deleteResult = await db.auditLog.deleteMany({ where: { id: { in: logs.map(l => l.id) } } })

  // Invalidate cache
  await deleteCached(CacheKeys.orgAuditLogs(org, 1, ""))

  return { success: true, message: `Successfully deleted ${deleteResult.count} audit ${deleteResult.count === 1 ? "log" : "logs"}` }
})
