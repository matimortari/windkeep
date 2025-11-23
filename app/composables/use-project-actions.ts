import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export function useProjectActions() {
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const orgStore = useOrgStore()

  const allProjects = computed(() => projectStore.projects)
  const projectSecrets = computed(() => projectStore.secrets)
  const loading = computed(() => projectStore.loading)
  const errors = computed(() => projectStore.errors)

  const activeOrgProjects = computed(() => {
    if (!orgStore.activeOrg?.id)
      return []

    return projectStore.projects.filter((project: any) => project.orgId === orgStore.activeOrg?.id)
  })

  const isOwner = (projectId: string) => {
    const project = projectStore.projects.find(p => p.id === projectId)
    return project?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "OWNER") ?? false
  }

  const isAdmin = (projectId: string) => {
    const project = projectStore.projects.find(p => p.id === projectId)
    return project?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "ADMIN") ?? false
  }

  const fetchProjects = async () => {
    await projectStore.getProjects()
  }

  const createProject = async (data: CreateProjectInput) => {
    return await projectStore.createProject(data)
  }

  const updateProject = async (projectId: string, data: UpdateProjectInput) => {
    return await projectStore.updateProject(projectId, data)
  }

  const deleteProject = async (projectId: string) => {
    await projectStore.deleteProject(projectId)
    await navigateTo("/admin/projects")
  }

  const addMember = async (projectId: string, data: AddProjectMemberInput) => {
    return await projectStore.addProjectMember(projectId, data)
  }

  const updateMemberRole = async (projectId: string, memberId: string, data: UpdateProjectMemberInput) => {
    return await projectStore.updateProjectMember(projectId, memberId, data)
  }

  const removeMember = async (projectId: string, memberId: string) => {
    await projectStore.removeProjectMember(projectId, memberId)
  }

  const fetchSecrets = async (projectId: string) => {
    return await projectStore.getProjectSecrets(projectId)
  }

  const createSecret = async (projectId: string, data: CreateSecretInput) => {
    return await projectStore.createProjectSecret(projectId, data)
  }

  const updateSecret = async (projectId: string, secretId: string, data: UpdateSecretInput) => {
    return await projectStore.updateProjectSecret(projectId, secretId, data)
  }

  const deleteSecret = async (projectId: string, secretId: string) => {
    await projectStore.deleteProjectSecret(projectId, secretId)
  }
  return {
    allProjects,
    activeOrgProjects,
    projectSecrets,
    loading,
    errors,
    isOwner,
    isAdmin,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    updateMemberRole,
    removeMember,
    fetchSecrets,
    createSecret,
    updateSecret,
    deleteSecret,
  }
}
