import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/lib/schemas/project-schema"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/lib/schemas/secret-schema"

export const useProjectStore = defineStore("project", () => {
  const projects = ref<any[]>([])
  const currentProject = ref<any | null>(null)
  const secrets = ref<any[]>([])
  const loading = ref<boolean>(false)
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
      const res = await projectService.getProjects()
      projects.value = res.projects || []
    }
    catch (err: any) {
      errors.value.getProjects = err?.message || "Failed to get projects"
      console.error("getProjects error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function createProject(data: CreateProjectInput) {
    loading.value = true
    errors.value.createProject = null

    try {
      const res = await projectService.createProject(data)
      projects.value.push(res)
      return res
    }
    catch (err: any) {
      errors.value.createProject = err?.message || "Failed to create project"
      console.error("createProject error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput) {
    loading.value = true
    errors.value.updateProject = null

    try {
      const res = await projectService.updateProject(projectId, data)
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = res
      }
      if (currentProject.value?.id === projectId) {
        currentProject.value = { ...currentProject.value, ...res }
      }
      return res
    }
    catch (err: any) {
      errors.value.updateProject = err?.message || "Failed to update project"
      console.error("updateProject error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProject(projectId: string) {
    loading.value = true
    errors.value.deleteProject = null

    try {
      await projectService.deleteProject(projectId)
      projects.value = projects.value.filter(p => p.id !== projectId)
      if (currentProject.value?.id === projectId) {
        currentProject.value = null
      }
    }
    catch (err: any) {
      errors.value.deleteProject = err?.message || "Failed to delete project"
      console.error("deleteProject error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function addProjectMember(projectId: string, data: AddProjectMemberInput) {
    loading.value = true
    errors.value.addProjectMember = null

    try {
      const res = await projectService.addProjectMember(projectId, data)
      if (currentProject.value?.id === projectId && currentProject.value.members) {
        currentProject.value.members.push(res)
      }
      return res
    }
    catch (err: any) {
      errors.value.addProjectMember = err?.message || "Failed to add project member"
      console.error("addProjectMember error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectMember(projectId: string, memberId: string, data: UpdateProjectMemberInput) {
    loading.value = true
    errors.value.updateProjectMember = null

    try {
      const res = await projectService.updateProjectMember(projectId, memberId, data)
      if (currentProject.value?.id === projectId && currentProject.value.members) {
        const index = currentProject.value.members.findIndex((m: any) => m.userId === memberId)
        if (index !== -1) {
          currentProject.value.members[index] = res
        }
      }
      return res
    }
    catch (err: any) {
      errors.value.updateProjectMember = err?.message || "Failed to update project member"
      console.error("updateProjectMember error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function removeProjectMember(projectId: string, memberId: string) {
    loading.value = true
    errors.value.removeProjectMember = null

    try {
      await projectService.removeProjectMember(projectId, memberId)
      if (currentProject.value?.id === projectId && currentProject.value.members) {
        currentProject.value.members = currentProject.value.members.filter((m: any) => m.userId !== memberId)
      }
    }
    catch (err: any) {
      errors.value.removeProjectMember = err?.message || "Failed to remove project member"
      console.error("removeProjectMember error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function getProjectSecrets(projectId: string) {
    loading.value = true
    errors.value.getProjectSecrets = null

    try {
      const res = await projectService.getProjectSecrets(projectId)
      const fetchedSecrets = Array.isArray(res) ? res : []
      secrets.value = fetchedSecrets
      if (currentProject.value?.id === projectId) {
        currentProject.value.secrets = fetchedSecrets
      }
      return fetchedSecrets
    }
    catch (err: any) {
      errors.value.getProjectSecrets = err?.message || "Failed to get project secrets"
      console.error("getProjectSecrets error:", err)
      return []
    }
    finally {
      loading.value = false
    }
  }

  async function createProjectSecret(projectId: string, data: CreateSecretInput) {
    loading.value = true
    errors.value.createProjectSecret = null

    try {
      const res = await projectService.createProjectSecret(projectId, data)

      secrets.value.push(res)
      if (currentProject.value?.id === projectId) {
        if (!currentProject.value.secrets) {
          currentProject.value.secrets = []
        }
        currentProject.value.secrets.push(res)
      }

      return res
    }
    catch (err: any) {
      errors.value.createProjectSecret = err?.message || "Failed to create project secret"
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
      const res = await projectService.updateProjectSecret(projectId, secretId, data)

      const secretsIndex = secrets.value.findIndex((s: any) => s.id === secretId)
      if (secretsIndex !== -1) {
        secrets.value[secretsIndex] = res
      }

      if (currentProject.value?.id === projectId && currentProject.value.secrets) {
        const currentIndex = currentProject.value.secrets.findIndex((s: any) => s.id === secretId)
        if (currentIndex !== -1) {
          currentProject.value.secrets[currentIndex] = res
        }
      }

      return res
    }
    catch (err: any) {
      errors.value.updateProjectSecret = err?.message || "Failed to update project secret"
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
      await projectService.deleteProjectSecret(projectId, secretId)

      // Update both secrets array and currentProject.secrets
      secrets.value = secrets.value.filter((s: any) => s.id !== secretId)
      if (currentProject.value?.id === projectId && currentProject.value.secrets) {
        currentProject.value.secrets = currentProject.value.secrets.filter((s: any) => s.id !== secretId)
      }
    }
    catch (err: any) {
      errors.value.deleteProjectSecret = err?.message || "Failed to delete project secret"
      console.error("deleteProjectSecret error:", err)
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
    currentProject,
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
