import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER"])

  const projectData = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      slug: true,
      orgId: true,
      org: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          secrets: true,
          memberships: true,
        },
      },
    },
  })
  if (!projectData) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  // Create audit log before deletion
  await createAuditLog({
    event,
    userId: user.id,
    orgId: projectData.orgId,
    projectId,
    action: "DELETE.PROJECT",
    resource: "project",
    description: `Deleted project "${projectData.name}" (${projectData.slug}) from organization "${projectData.org.name}" (${projectData._count.secrets} secret(s), ${projectData._count.memberships} member(s))`,
    metadata: {
      projectId: projectData.id,
      projectName: projectData.name,
      projectSlug: projectData.slug,
      orgId: projectData.orgId,
      orgName: projectData.org.name,
      secretsDeleted: projectData._count.secrets,
      membersRemoved: projectData._count.memberships,
    },
  })

  await db.project.delete({
    where: { id: projectId },
  })

  return { success: true, message: "Project deleted successfully" }
})
