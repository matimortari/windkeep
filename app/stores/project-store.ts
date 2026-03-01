import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export const useProjectStore = defineStore("project", () => {
  const toast = useToast()
  const userStore = useUserStore()
  const projects = ref<Project[]>([])
  const secrets = ref<Secret[]>([])
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
    catch (err: any) {
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
    catch (err: any) {
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
    catch (err: any) {
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
    catch (err: any) {
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
    catch (err: any) {
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
    catch (err: any) {
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
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to remove project member")
      toast.error(message)
      console.error("removeProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getProjectSecrets(projectId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ decryptedSecrets: Secret[] }>(`/api/projects/${projectId}/secrets`, { method: "GET", credentials: "include" })
      secrets.value = Array.isArray(res.decryptedSecrets) ? res.decryptedSecrets : []
      return secrets.value
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to get project secrets")
      toast.error(message)
      console.error("getProjectSecrets error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProjectSecret(projectId: string, data: CreateSecretInput) {
    loading.value = true

    try {
      const res = await $fetch<Secret>(`/api/projects/${projectId}/secrets`, { method: "POST", body: data, credentials: "include" })
      secrets.value.push(res)
      toast.success("Secret created successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to create project secret")
      toast.error(message)
      console.error("createProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectSecret(projectId: string, secretId: string, data: UpdateSecretInput) {
    loading.value = true

    try {
      const res = await $fetch<Secret>(`/api/projects/${projectId}/secrets/${secretId}`, { method: "PUT", body: data, credentials: "include" })
      const index = secrets.value.findIndex(s => s.id === secretId)
      if (index !== -1) {
        secrets.value[index] = res
      }
      toast.success("Secret updated successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to update project secret")
      toast.error(message)
      console.error("updateProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProjectSecret(projectId: string, secretId: string) {
    loading.value = true

    try {
      await $fetch(`/api/projects/${projectId}/secrets/${secretId}`, { method: "DELETE", credentials: "include" })
      secrets.value = secrets.value.filter(s => s.id !== secretId)
      toast.success("Secret deleted successfully")
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to delete project secret")
      toast.error(message)
      console.error("deleteProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getSecretHistory(projectId: string, secretId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ history: EnvironmentHistory[] }>(`/api/projects/${projectId}/secrets/${secretId}/history`, { method: "GET", credentials: "include" })
      return res.history
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to get secret history")
      toast.error(message)
      console.error("getSecretHistory error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    projects,
    secrets,
    isOwner,
    isAdmin,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    addProjectMember,
    updateProjectMember,
    removeProjectMember,
    getProjectSecrets,
    createProjectSecret,
    updateProjectSecret,
    deleteProjectSecret,
    getSecretHistory,
  }
})
