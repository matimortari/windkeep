import type { AcceptInvitationInput, CreateInvitationInput, CreateOrganizationInput, UpdateMemberRoleInput, UpdateOrganizationInput } from "#shared/lib/schemas/org"

export function useOrganizationActions() {
  const organizationStore = useOrganizationStore()
  const userStore = useUserStore()
  const router = useRouter()

  /**
   * Create a new organization
   * @param data Organization creation data (name)
   */
  const createOrganization = async (data: CreateOrganizationInput) => {
    const org = await organizationStore.createOrg(data)
    if (org) {
      await userStore.getUser()
      // Set the newly created org as active if user has no active org
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
  const updateOrganization = async (orgId: string, data: UpdateOrganizationInput) => {
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
      await router.push("/onboarding/create-org")
    }
  }

  /**
   * Update a member's role in the organization
   * @param orgId Organization ID
   * @param memberId Member ID
   * @param data Updated member data (role)
   */
  const updateMemberRole = async (orgId: string, memberId: string, data: UpdateMemberRoleInput) => {
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
  const inviteMember = async (orgId: string, data: CreateInvitationInput) => {
    return await organizationStore.createInvite(orgId, data)
  }

  /**
   * Accept an organization invitation
   * @param orgId Organization ID
   * @param data Invitation acceptance data (token)
   */
  const acceptInvitation = async (orgId: string, data: AcceptInvitationInput) => {
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

  return {
    // Store state
    currentOrganization,
    allOrganizations,
    loading: computed(() => organizationStore.loading),
    errors: computed(() => organizationStore.errors),

    // Actions
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateMemberRole,
    removeMember,
    inviteMember,
    acceptInvitation,

    // Computed properties
    hasMembers,
    hasInvites,
    memberCount,
  }
}
