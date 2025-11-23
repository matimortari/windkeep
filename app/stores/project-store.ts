import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export const useProjectStore = defineStore("project", () => {
  const projects = ref<Project[]>([])
  const secrets = ref<any[]>([])
  const loading = ref(false)
  const errors = ref<Record<
    | "getProjects"
    | "createProject"
    | "updateProject"
    | "deleteProject"
    | "addProjectMember"
    | "updateProjectMember"
    | "removeProjectMember"
    | "getProjectSecrets"
    | "createProjectSecret"
    | "updateProjectSecret"
    | "deleteProjectSecret",
    string | null
  >>({
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
  })

  async function getProjects() {
    loading.value = true
    errors.value.getProjects = null

    try {
      const res = await $fetch<{ projects: Project[] }>(`${API_URL}/projects`, { method: "GET", credentials: "include" })
      projects.value = res.projects || []
    }
    catch (err: any) {
      errors.value.getProjects = err?.message || "Failed to get projects"
      console.error("getProjects error:", err)
    }
    finally { loading.value = false }
  }

  async function createProject(data: CreateProjectInput) {
    loading.value = true
    errors.value.createProject = null

    try {
      const res = await $fetch<Project>(`${API_URL}/projects`, { method: "POST", body: data, credentials: "include" })
      projects.value.push(res)
      return res
    }
    catch (err: any) {
      errors.value.createProject = err?.message || "Failed to create project"
      console.error("createProject error:", err)
    }
    finally { loading.value = false }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput) {
    loading.value = true
    errors.value.updateProject = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}`, { method: "PUT", body: data, credentials: "include" })
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = { ...res, description: res.description === null ? undefined : res.description }
      }
      return res
    }
    catch (err: any) {
      errors.value.updateProject = err?.message || "Failed to update project"
      console.error("updateProject error:", err)
    }
    finally { loading.value = false }
  }

  async function deleteProject(projectId: string) {
    loading.value = true
    errors.value.deleteProject = null

    try {
      await $fetch(`${API_URL}/projects/${projectId}`, { method: "DELETE", credentials: "include" })
      projects.value = projects.value.filter(p => p.id !== projectId)
    }
    catch (err: any) {
      errors.value.deleteProject = err?.message || "Failed to delete project"
      console.error("deleteProject error:", err)
    }
    finally { loading.value = false }
  }

  async function addProjectMember(projectId: string, data: AddProjectMemberInput) {
    loading.value = true
    errors.value.addProjectMember = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}/members`, { method: "POST", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.addProjectMember = err?.message || "Failed to add project member"
      console.error("addProjectMember error:", err)
    }
    finally { loading.value = false }
  }

  async function updateProjectMember(projectId: string, memberId: string, data: UpdateProjectMemberInput) {
    loading.value = true
    errors.value.updateProjectMember = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.updateProjectMember = err?.message || "Failed to update project member"
      console.error("updateProjectMember error:", err)
    }
    finally { loading.value = false }
  }

  async function removeProjectMember(projectId: string, memberId: string) {
    loading.value = true
    errors.value.removeProjectMember = null

    try {
      await $fetch(`${API_URL}/projects/${projectId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
    }
    catch (err: any) {
      errors.value.removeProjectMember = err?.message || "Failed to remove project member"
      console.error("removeProjectMember error:", err)
    }
    finally { loading.value = false }
  }

  async function getProjectSecrets(projectId: string) {
    loading.value = true
    errors.value.getProjectSecrets = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}/secrets`, { method: "GET", credentials: "include" })
      const fetchedSecrets = Array.isArray(res) ? res : []
      secrets.value = fetchedSecrets
      return fetchedSecrets
    }
    catch (err: any) {
      errors.value.getProjectSecrets = err?.message || "Failed to get project secrets"
      console.error("getProjectSecrets error:", err)
      return []
    }
    finally { loading.value = false }
  }

  async function createProjectSecret(projectId: string, data: CreateSecretInput) {
    loading.value = true
    errors.value.createProjectSecret = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}/secrets`, { method: "POST", body: data, credentials: "include" })
      secrets.value.push(res)
      return res
    }
    catch (err: any) {
      errors.value.createProjectSecret = err?.message || "Failed to create project secret"
      console.error("createProjectSecret error:", err)
      throw err
    }
    finally { loading.value = false }
  }

  async function updateProjectSecret(projectId: string, secretId: string, data: UpdateSecretInput) {
    loading.value = true
    errors.value.updateProjectSecret = null

    try {
      const res = await $fetch(`${API_URL}/projects/${projectId}/secrets/${secretId}`, { method: "PUT", body: data, credentials: "include" })
      const idx = secrets.value.findIndex((s: any) => s.id === secretId)
      if (idx !== -1)
        secrets.value[idx] = res
      return res
    }
    catch (err: any) {
      errors.value.updateProjectSecret = err?.message || "Failed to update project secret"
      console.error("updateProjectSecret error:", err)
      throw err
    }
    finally { loading.value = false }
  }

  async function deleteProjectSecret(projectId: string, secretId: string) {
    loading.value = true
    errors.value.deleteProjectSecret = null

    try {
      await $fetch(`${API_URL}/projects/${projectId}/secrets/${secretId}`, { method: "DELETE", credentials: "include" })
      secrets.value = secrets.value.filter((s: any) => s.id !== secretId)
    }
    catch (err: any) {
      errors.value.deleteProjectSecret = err?.message || "Failed to delete project secret"
      console.error("deleteProjectSecret error:", err)
      throw err
    }
    finally { loading.value = false }
  }

  return {
    loading,
    errors,
    projects,
    secrets,
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
  }
})
