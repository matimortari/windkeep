import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/lib/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/lib/schemas/secret-schema"

export function useProjectActions() {
  const projectStore = useProjectStore()
  const userStore = useUserStore()

  const currentProject = computed(() => projectStore.currentProject)
  const allProjects = computed(() => projectStore.projects)
  const projectSecrets = computed(() => projectStore.secrets)
  const loading = computed(() => projectStore.loading)
  const errors = computed(() => projectStore.errors)

  /**
   * Get projects filtered by the active organization
   */
  const activeOrgProjects = computed(() => {
    const activeOrgId = userStore.activeOrg?.id
    if (!activeOrgId) {
      return []
    }
    return projectStore.projects.filter((project: any) => project.organizationId === activeOrgId)
  })

  /**
   * Fetch all projects
   */
  const fetchProjects = async () => {
    await projectStore.getProjects()
  }

  /**
   * Create a new project
   * @param data Project creation data (name, organizationId)
   */
  const createProject = async (data: CreateProjectInput) => {
    return await projectStore.createProject(data)
  }

  /**
   * Update project information
   * @param projectId Project ID
   * @param data Project data to update (name)
   */
  const updateProject = async (projectId: string, data: UpdateProjectInput) => {
    return await projectStore.updateProject(projectId, data)
  }

  /**
   * Delete a project and redirect to projects page
   * @param projectId Project ID
   */
  const deleteProject = async (projectId: string) => {
    await projectStore.deleteProject(projectId)
    await navigateTo("/admin/projects")
  }

  /**
   * Add a member to the project
   * @param projectId Project ID
   * @param data Member data (userId, role)
   */
  const addMember = async (projectId: string, data: AddProjectMemberInput) => {
    return await projectStore.addProjectMember(projectId, data)
  }

  /**
   * Update a member's role in the project
   * @param projectId Project ID
   * @param memberId Member ID
   * @param data Updated member data (role)
   */
  const updateMemberRole = async (projectId: string, memberId: string, data: UpdateProjectMemberInput) => {
    return await projectStore.updateProjectMember(projectId, memberId, data)
  }

  /**
   * Remove a member from the project
   * @param projectId Project ID
   * @param memberId Member ID
   */
  const removeMember = async (projectId: string, memberId: string) => {
    await projectStore.removeProjectMember(projectId, memberId)
  }

  /**
   * Fetch all secrets for a project
   * @param projectId Project ID
   */
  const fetchSecrets = async (projectId: string) => {
    return await projectStore.getProjectSecrets(projectId)
  }

  /**
   * Create a new secret in the project
   * @param projectId Project ID
   * @param data Secret creation data (key, value, environment)
   */
  const createSecret = async (projectId: string, data: CreateSecretInput) => {
    return await projectStore.createProjectSecret(projectId, data)
  }

  /**
   * Update an existing secret
   * @param projectId Project ID
   * @param secretId Secret ID
   * @param data Secret data to update (key, value, environment)
   */
  const updateSecret = async (projectId: string, secretId: string, data: UpdateSecretInput) => {
    return await projectStore.updateProjectSecret(projectId, secretId, data)
  }

  /**
   * Delete a secret from the project
   * @param projectId Project ID
   * @param secretId Secret ID
   */
  const deleteSecret = async (projectId: string, secretId: string) => {
    await projectStore.deleteProjectSecret(projectId, secretId)
  }

  /**
   * Get member count for current project
   */
  const memberCount = computed(() => {
    return currentProject.value?.members?.length || 0
  })

  /**
   * Check if current user is owner of the current project
   */
  const isOwner = computed(() => {
    return currentProject.value?.roles?.find((r: any) => r.userId === userStore.user?.id)?.role === "OWNER"
  })

  /**
   * Check if current user is admin of the current project
   */
  const isAdmin = computed(() => {
    return currentProject.value?.roles?.find((r: any) => r.userId === userStore.user?.id)?.role === "ADMIN"
  })

  /**
   * Get secret count for current project
   */
  const secretCount = computed(() => {
    return currentProject.value?.secrets?.length || 0
  })

  /**
   * Filter secrets by environment
   * @param environment Environment to filter by
   */
  const getSecretsByEnvironment = (environment: string) => {
    return computed(() => {
      return projectSecrets.value.filter((s: any) => s.environment === environment)
    })
  }

  /**
   * Set the current project by ID
   * @param projectId Project ID to set as current, or null to clear
   */
  const setCurrentProject = (projectId: string | null) => {
    projectStore.setCurrentProject(projectId)
  }

  return {
    currentProject,
    allProjects,
    activeOrgProjects,
    projectSecrets,
    memberCount,
    secretCount,
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
    getSecretsByEnvironment,
    setCurrentProject,
  }
}
