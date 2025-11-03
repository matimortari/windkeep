import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/lib/schemas/org-schema"

export function useOrganizationActions() {
  const organizationStore = useOrganizationStore()
  const userStore = useUserStore()

  /**
   * Create a new organization
   * @param data Organization creation data (name)
   */
  const createOrganization = async (data: CreateOrgInput) => {
    const org = await organizationStore.createOrg(data)
    if (org) {
      await userStore.getUser()
      if (!userStore.user?.activeOrgId && org.id) {
        await userStore.setActiveOrg(org.id)
      }
    }
    return org
  }

  /**
   * Update organization information
   * @param orgId Organization ID
   * @param data Organization data to update (name)
   */
  const updateOrganization = async (orgId: string, data: UpdateOrgInput) => {
    const org = await organizationStore.updateOrg(orgId, data)
    if (org) {
      await userStore.getUser()
    }
    return org
  }

  /**
   * Delete an organization and redirect to home
   * @param orgId Organization ID
   */
  const deleteOrganization = async (orgId: string) => {
    await organizationStore.deleteOrg(orgId)
    await userStore.getUser()
    if (userStore.activeOrg?.id === orgId) {
      await navigateTo("/onboarding/create-org")
    }
  }

  /**
   * Update a member's role in the organization
   * @param orgId Organization ID
   * @param memberId Member ID
   * @param data Updated member data (role)
   */
  const updateMemberRole = async (orgId: string, memberId: string, data: UpdateOrgMemberInput) => {
    return await organizationStore.updateOrgMember(orgId, memberId, data)
  }

  /**
   * Remove a member from the organization
   * @param orgId Organization ID
   * @param memberId Member ID
   */
  const removeMember = async (orgId: string, memberId: string) => {
    await organizationStore.removeOrgMember(orgId, memberId)
  }

  /**
   * Create an invitation to join the organization
   * @param orgId Organization ID
   * @param data Invitation data (email, role)
   */
  const inviteMember = async (orgId: string, data: CreateInviteInput) => {
    return await organizationStore.createInvite(orgId, data)
  }

  /**
   * Accept an organization invitation
   * @param orgId Organization ID
   * @param data Invitation acceptance data (token)
   */
  const acceptInvite = async (orgId: string, data: AcceptInviteInput) => {
    const org = await organizationStore.acceptInvite(orgId, data)
    if (org) {
      await userStore.getUser()
      await userStore.setActiveOrg(orgId)
    }
    return org
  }

  /**
   * Get current organization details
   */
  const currentOrganization = computed(() => organizationStore.currentOrg)

  /**
   * Get all organizations
   */
  const allOrganizations = computed(() => organizationStore.organizations)

  /**
   * Check if current organization has members
   */
  const hasMembers = computed(() => {
    return currentOrganization.value?.members && currentOrganization.value.members.length > 0
  })

  /**
   * Check if current organization has invites
   */
  const hasInvites = computed(() => {
    return currentOrganization.value?.invites && currentOrganization.value.invites.length > 0
  })

  /**
   * Get member count for current organization
   */
  const memberCount = computed(() => {
    return currentOrganization.value?.members?.length || 0
  })

  /**
   * Check if current user is owner or admin of the organization
   */
  const isOwner = computed(() => {
    return organizationStore.currentOrg?.memberships.find((m: any) => m.userId === userStore.user?.id)?.role === "owner"
  })

  /**
   * Check if current user is admin of the organization
   */
  const isAdmin = computed(() => {
    return organizationStore.currentOrg?.memberships.find((m: any) => m.userId === userStore.user?.id)?.role === "admin"
  })

  /**
   * Loading state
   */
  const loading = computed(() => organizationStore.loading)

  /**
   * Error state
   */
  const errors = computed(() => organizationStore.errors)

  return {
    currentOrganization,
    allOrganizations,
    loading,
    errors,
    hasMembers,
    hasInvites,
    memberCount,
    isOwner,
    isAdmin,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateMemberRole,
    removeMember,
    inviteMember,
    acceptInvite,
  }
}
