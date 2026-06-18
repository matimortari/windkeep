import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/schemas/project-schema"
import type { CreateServiceTokenInput } from "#shared/schemas/service-token-schema" // Added for schema validation types

export const useProjectStore = defineStore("project", () => {
  const toast = useToast()
  const userStore = useUserStore()
  const projects = ref<Project[]>([])
  const serviceTokens = ref<ServiceToken[]>([])
  const loading = ref(false)

  const isOwner = computed(() => (projectId: string) => projects.value.find(p => p.id === projectId)?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "OWNER") ?? false)
  const isAdmin = computed(() => (projectId: string) => projects.value.find(p => p.id === projectId)?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "ADMIN") ?? false)

  async function getProjects() {
    loading.value = true

    try {
      const res = await $fetch<{ projects: Project[] }>("/api/projects", { method: "GET", credentials: "include" })
      projects.value = res.projects || []
      return res.projects
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to get projects")
      toast.error(message)
      console.error("getProjects error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProject(data: CreateProjectInput) {
    loading.value = true

    try {
      const res = await $fetch<{ project: Project }>("/api/projects", { method: "POST", body: data, credentials: "include" })
      projects.value.push(res.project)
      toast.success("Project created successfully")
      return res.project
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create project")
      toast.error(message)
      console.error("createProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput) {
    loading.value = true

    try {
      const res = await $fetch<{ project: Project }>(`/api/projects/${projectId}`, { method: "PUT", body: data, credentials: "include" })
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = res.project
      }
      toast.success("Project updated successfully")
      return res.project
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update project")
      toast.error(message)
      console.error("updateProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProject(projectId: string) {
    loading.value = true

    try {
      await $fetch(`/api/projects/${projectId}`, { method: "DELETE", credentials: "include" })
      projects.value = projects.value.filter(p => p.id !== projectId)
      toast.success("Project deleted successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete project")
      toast.error(message)
      console.error("deleteProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function addProjectMember(projectId: string, data: AddProjectMemberInput) {
    loading.value = true

    try {
      const res = await $fetch<ProjectMembership>(`/api/projects/${projectId}/members`, { method: "POST", body: data, credentials: "include" })
      toast.success("Project member added successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to add project member")
      toast.error(message)
      console.error("addProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectMember(projectId: string, memberId: string, data: UpdateProjectMemberInput) {
    loading.value = true

    try {
      const res = await $fetch<ProjectMembership>(`/api/projects/${projectId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      toast.success("Project member updated successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update project member")
      toast.error(message)
      console.error("updateProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function removeProjectMember(projectId: string, memberId: string) {
    loading.value = true

    try {
      await $fetch(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
      toast.success("Project member removed successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to remove project member")
      toast.error(message)
      console.error("removeProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getProjectServiceTokens(projectId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ tokens: ServiceToken[] }>(`/api/projects/${projectId}/service-tokens`, { method: "GET", credentials: "include" })
      serviceTokens.value = res.tokens || []
      return serviceTokens.value
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch service tokens")
      toast.error(message)
      console.error("getProjectServiceTokens error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProjectServiceToken(projectId: string, data: Omit<CreateServiceTokenInput, "projectId">) {
    loading.value = true

    try {
      const res = await $fetch<{ serviceToken: ServiceToken, rawToken: string, message: string }>(`/api/projects/${projectId}/service-tokens`, { method: "POST", body: data, credentials: "include" })
      serviceTokens.value.push(res.serviceToken)
      toast.success("Service token generated successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to generate service token")
      toast.error(message)
      console.error("createProjectServiceToken error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function revokeProjectServiceToken(projectId: string, tokenId: string) {
    loading.value = true

    try {
      await $fetch(`/api/projects/${projectId}/service-tokens/${tokenId}`, { method: "DELETE", credentials: "include" })
      serviceTokens.value = serviceTokens.value.filter(token => token.id !== tokenId)
      toast.success("Service token revoked successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to revoke service token")
      toast.error(message)
      console.error("revokeProjectServiceToken error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    projects,
    serviceTokens,
    isOwner,
    isAdmin,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    getProjectServiceTokens,
    createProjectServiceToken,
    revokeProjectServiceToken,
  }
})
