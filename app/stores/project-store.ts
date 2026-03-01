import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export const useProjectStore = defineStore("project", () => {
  const userStore = useUserStore()

  const projects = ref<Project[]>([])
  const secrets = ref<Secret[]>([])
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({
    getProjects: null,
    createProject: null,
    updateProject: null,
    deleteProject: null,
    addProjectMember: null,
    updateProjectMember: null,
    removeProjectMember: null,
    getProjectSecrets: null,
    createProjectSecret: null,
    updateProjectSecret: null,
    deleteProjectSecret: null,
    getSecretHistory: null,
  })

  const isOwner = computed(() => (projectId: string) => projects.value.find(p => p.id === projectId)?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "OWNER") ?? false)
  const isAdmin = computed(() => (projectId: string) => projects.value.find(p => p.id === projectId)?.memberships?.some(m => m.userId === userStore.user?.id && m.role === "ADMIN") ?? false)

  async function getProjects() {
    loading.value = true
    errors.value.getProjects = null

    try {
      const res = await $fetch<{ projects: Project[] }>("/api/projects", { method: "GET", credentials: "include" })
      projects.value = res.projects || []
      return res.projects
    }
    catch (err: any) {
      errors.value.getProjects = getErrorMessage(err, "Failed to get projects")
      console.error("getProjects error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProject(data: CreateProjectInput) {
    loading.value = true
    errors.value.createProject = null

    try {
      const res = await $fetch<{ project: Project }>("/api/projects", { method: "POST", body: data, credentials: "include" })
      projects.value.push(res.project)
      return res.project
    }
    catch (err: any) {
      errors.value.createProject = getErrorMessage(err, "Failed to create project")
      console.error("createProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput) {
    loading.value = true
    errors.value.updateProject = null

    try {
      const res = await $fetch<{ project: Project }>(`/api/projects/${projectId}`, { method: "PUT", body: data, credentials: "include" })
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = res.project
      }
      return res.project
    }
    catch (err: any) {
      errors.value.updateProject = getErrorMessage(err, "Failed to update project")
      console.error("updateProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProject(projectId: string) {
    loading.value = true
    errors.value.deleteProject = null

    try {
      await $fetch(`/api/projects/${projectId}`, { method: "DELETE", credentials: "include" })
      projects.value = projects.value.filter(p => p.id !== projectId)
    }
    catch (err: any) {
      errors.value.deleteProject = getErrorMessage(err, "Failed to delete project")
      console.error("deleteProject error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function addProjectMember(projectId: string, data: AddProjectMemberInput) {
    loading.value = true
    errors.value.addProjectMember = null

    try {
      const res = await $fetch<ProjectMembership>(`/api/projects/${projectId}/members`, { method: "POST", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.addProjectMember = getErrorMessage(err, "Failed to add project member")
      console.error("addProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectMember(projectId: string, memberId: string, data: UpdateProjectMemberInput) {
    loading.value = true
    errors.value.updateProjectMember = null

    try {
      const res = await $fetch<ProjectMembership>(`/api/projects/${projectId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.updateProjectMember = getErrorMessage(err, "Failed to update project member")
      console.error("updateProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function removeProjectMember(projectId: string, memberId: string) {
    loading.value = true
    errors.value.removeProjectMember = null

    try {
      await $fetch(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
    }
    catch (err: any) {
      errors.value.removeProjectMember = getErrorMessage(err, "Failed to remove project member")
      console.error("removeProjectMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getProjectSecrets(projectId: string) {
    loading.value = true
    errors.value.getProjectSecrets = null

    try {
      const res = await $fetch<{ decryptedSecrets: Secret[] }>(`/api/projects/${projectId}/secrets`, { method: "GET", credentials: "include" })
      secrets.value = Array.isArray(res.decryptedSecrets) ? res.decryptedSecrets : []
      return secrets.value
    }
    catch (err: any) {
      errors.value.getProjectSecrets = getErrorMessage(err, "Failed to get project secrets")
      console.error("getProjectSecrets error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProjectSecret(projectId: string, data: CreateSecretInput) {
    loading.value = true
    errors.value.createProjectSecret = null

    try {
      const res = await $fetch<Secret>(`/api/projects/${projectId}/secrets`, { method: "POST", body: data, credentials: "include" })
      secrets.value.push(res)
      return res
    }
    catch (err: any) {
      errors.value.createProjectSecret = getErrorMessage(err, "Failed to create project secret")
      console.error("createProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectSecret(projectId: string, secretId: string, data: UpdateSecretInput) {
    loading.value = true
    errors.value.updateProjectSecret = null

    try {
      const res = await $fetch<Secret>(`/api/projects/${projectId}/secrets/${secretId}`, { method: "PUT", body: data, credentials: "include" })
      const index = secrets.value.findIndex(s => s.id === secretId)
      if (index !== -1) {
        secrets.value[index] = res
      }
      return res
    }
    catch (err: any) {
      errors.value.updateProjectSecret = getErrorMessage(err, "Failed to update project secret")
      console.error("updateProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProjectSecret(projectId: string, secretId: string) {
    loading.value = true
    errors.value.deleteProjectSecret = null

    try {
      await $fetch(`/api/projects/${projectId}/secrets/${secretId}`, { method: "DELETE", credentials: "include" })
      secrets.value = secrets.value.filter(s => s.id !== secretId)
    }
    catch (err: any) {
      errors.value.deleteProjectSecret = getErrorMessage(err, "Failed to delete project secret")
      console.error("deleteProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getSecretHistory(projectId: string, secretId: string) {
    loading.value = true
    errors.value.getSecretHistory = null

    try {
      const res = await $fetch<{ history: EnvironmentHistory[] }>(`/api/projects/${projectId}/secrets/${secretId}/history`, { method: "GET", credentials: "include" })
      return res.history
    }
    catch (err: any) {
      errors.value.getSecretHistory = getErrorMessage(err, "Failed to get secret history")
      console.error("getSecretHistory error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    errors,
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
