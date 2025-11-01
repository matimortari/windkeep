import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput, UpdateProjectMemberInput } from "#shared/lib/schemas/project"
import type { CreateSecretInput, UpdateSecretInput } from "#shared/lib/schemas/secret"

export const projectService = {
  /**
   * Fetch all projects for current user
   */
  getProjects: async () => {
    const res = await $fetch(`${API_URL}/projects`, {
      method: "GET",
      credentials: "include",
    })

    return res
  },

  /**
   * Create a new project
   * @param data Project creation data
   */
  createProject: async (data: CreateProjectInput) => {
    const res = await $fetch(`${API_URL}/projects`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Update a project
   * @param projectId Project ID
   * @param data Partial project data to update
   */
  updateProject: async (projectId: string, data: UpdateProjectInput) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Delete a project
   * @param projectId Project ID
   */
  deleteProject: async (projectId: string) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },

  /**
   * Add a member to a project
   * @param projectId Project ID
   * @param data Member data
   */
  addProjectMember: async (projectId: string, data: AddProjectMemberInput) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/members`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Update a project member's role
   * @param projectId Project ID
   * @param memberId Member ID
   * @param data Updated member data
   */
  updateProjectMember: async (projectId: string, memberId: string, data: UpdateProjectMemberInput) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/members/${memberId}`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Remove a member from a project
   * @param projectId Project ID
   * @param memberId Member ID
   */
  removeProjectMember: async (projectId: string, memberId: string) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },

  /**
   * Get all secrets for a project
   * @param projectId Project ID
   */
  getProjectSecrets: async (projectId: string) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/secrets`, {
      method: "GET",
      credentials: "include",
    })

    return res
  },

  /**
   * Create a new secret in a project
   * @param projectId Project ID
   * @param data Secret creation data
   */
  createProjectSecret: async (projectId: string, data: CreateSecretInput) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/secrets`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Update a project secret
   * @param projectId Project ID
   * @param secretId Secret ID
   * @param data Updated secret data
   */
  updateProjectSecret: async (projectId: string, secretId: string, data: UpdateSecretInput) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/secrets/${secretId}`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Delete a project secret
   * @param projectId Project ID
   * @param secretId Secret ID
   */
  deleteProjectSecret: async (projectId: string, secretId: string) => {
    const res = await $fetch(`${API_URL}/projects/${projectId}/secrets/${secretId}`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },
}
