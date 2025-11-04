import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/lib/schemas/org-schema"

export function useOrganizationActions() {
  const organizationStore = useOrganizationStore()
  const userStore = useUserStore()

  const currentOrganization = computed(() => organizationStore.currentOrg)
  const allOrganizations = computed(() => organizationStore.organizations)
  const loading = computed(() => organizationStore.loading)
  const errors = computed(() => organizationStore.errors)

  const hasMembers = computed(() => {
    return currentOrganization.value?.members && currentOrganization.value.members.length > 0
  })

  const hasInvites = computed(() => {
    return currentOrganization.value?.invites && currentOrganization.value.invites.length > 0
  })

  const memberCount = computed(() => {
    return currentOrganization.value?.members?.length || 0
  })

  const isOwner = computed(() => {
    const org = userStore.activeOrg || organizationStore.currentOrg
    return org?.memberships?.find((m: any) => m.userId === userStore.user?.id)?.role === "OWNER"
  })

  const isAdmin = computed(() => {
    const org = userStore.activeOrg || organizationStore.currentOrg
    return org?.memberships?.find((m: any) => m.userId === userStore.user?.id)?.role === "ADMIN"
  })

  /**
   * Create a new organization
   * @param data Organization creation data (name)
   */
  const createOrganization = async (data: CreateOrgInput) => {
    const org = await organizationStore.createOrg(data)
    if (org) {
      await userStore.getUser()
      await userStore.setActiveOrg(org.id)
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
