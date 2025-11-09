import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export const organizationService = {
  /**
   * Create a new organization
   * @param data Organization creation data
   */
  createOrg: async (data: CreateOrgInput) => {
    const res = await $fetch(`${API_URL}/org`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Update an organization
   * @param orgId Organization ID
   * @param data Partial organization data to update
   */
  updateOrg: async (orgId: string, data: UpdateOrgInput) => {
    const res = await $fetch(`${API_URL}/org/${orgId}`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Delete an organization
   * @param orgId Organization ID
   */
  deleteOrg: async (orgId: string) => {
    const res = await $fetch(`${API_URL}/org/${orgId}`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },

  /**
   * Update an organization member's role
   * @param orgId Organization ID
   * @param memberId Member ID
   * @param data Updated member data
   */
  updateOrgMember: async (orgId: string, memberId: string, data: UpdateOrgMemberInput) => {
    const res = await $fetch(`${API_URL}/org/${orgId}/members/${memberId}`, {
      method: "PUT",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Remove a member from an organization
   * @param orgId Organization ID
   * @param memberId Member ID
   */
  removeOrgMember: async (orgId: string, memberId: string) => {
    const res = await $fetch(`${API_URL}/org/${orgId}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    })

    return res
  },

  /**
   * Create an invitation to join the organization
   * @param orgId Organization ID
   * @param data Invitation data
   */
  createInvite: async (orgId: string, data: CreateInviteInput) => {
    const res = await $fetch(`${API_URL}/org/${orgId}/invite/create`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },

  /**
   * Accept an organization invitation
   * @param orgId Organization ID
   * @param data Invitation acceptance data (token)
   */
  acceptInvite: async (orgId: string, data: AcceptInviteInput) => {
    const res = await $fetch(`${API_URL}/org/${orgId}/invite/accept`, {
      method: "POST",
      body: data,
      credentials: "include",
    })

    return res
  },
}
