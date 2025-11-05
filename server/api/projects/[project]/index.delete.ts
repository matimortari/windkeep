import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, project, ["OWNER"])

  const projectData = await db.project.findUnique({
    where: { id: project },
    select: {
      id: true,
      name: true,
      slug: true,
      organizationId: true,
      organization: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          secrets: true,
          roles: true,
        },
      },
    },
  })
  if (!projectData) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Create audit log before deletion (since cascade will delete project audit logs)
  await createAuditLog({
    userId: user.id,
    organizationId: projectData.organizationId,
    projectId: project,
    action: "project.deleted",
    resource: "project",
    metadata: {
      projectName: projectData.name,
      projectSlug: projectData.slug,
      organizationName: projectData.organization.name,
      secretsDeleted: projectData._count.secrets,
      membersRemoved: projectData._count.roles,
    },
    description: `Deleted project "${projectData.name}" (${projectData.slug}) from organization "${projectData.organization.name}" (${projectData._count.secrets} secret(s), ${projectData._count.roles} member(s))`,
    event,
  })

  // Delete the project (cascade will handle secrets, secret values, roles, and audit logs)
  await db.project.delete({
    where: { id: project },
  })

  return {
    success: true,
    message: `Project "${projectData.name}" deleted successfully`,
    secretsDeleted: projectData._count.secrets,
  }
})
