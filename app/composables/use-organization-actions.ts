import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export function useOrgActions() {
  const orgStore = useOrgStore()
  const userStore = useUserStore()

  const activeOrg = computed(() => orgStore.activeOrg)
  const loading = computed(() => orgStore.loading)
  const errors = computed(() => orgStore.errors)

  const activeMembership = computed(() =>
    userStore.user?.orgMemberships?.find(m => m.isActive),
  )

  const isOwner = computed(() => activeMembership.value?.role === "OWNER")
  const isAdmin = computed(() => activeMembership.value?.role === "ADMIN")

  const createOrg = async (data: CreateOrgInput) => {
    const org = await orgStore.createOrg(data)
    if (org)
      await userStore.getUser()
    return org
  }

  const setActiveOrg = async (orgId: string) => {
    const org = await orgStore.getOrg(orgId)
    if (org) {
      orgStore.setActiveOrg(org)
    }

    return org
  }

  const updateOrg = async (orgId: string, data: UpdateOrgInput) => {
    const org = await orgStore.updateOrg(orgId, data)
    if (org)
      await userStore.getUser()
    return org
  }

  const deleteOrg = async (orgId: string) => {
    await orgStore.deleteOrg(orgId)
    await userStore.getUser()

    const active = userStore.user?.orgMemberships?.find(m => m.isActive)
    if (active?.orgId === orgId) {
      await navigateTo("/onboarding/create-org")
    }
  }

  const updateMemberRole = (orgId: string, memberId: string, data: UpdateOrgMemberInput) =>
    orgStore.updateOrgMember(orgId, memberId, data)

  const removeMember = (orgId: string, memberId: string) =>
    orgStore.removeOrgMember(orgId, memberId)

  const inviteMember = (orgId: string, data: CreateInviteInput) =>
    orgStore.createInvite(orgId, data)

  const acceptInvite = async (orgId: string, data: AcceptInviteInput) => {
    const org = await orgStore.acceptInvite(orgId, data)
    if (org)
      await userStore.getUser()
    return org
  }

  return {
    activeOrg,
    loading,
    errors,
    isOwner,
    isAdmin,
    activeMembership,
    createOrg,
    setActiveOrg,
    updateOrg,
    deleteOrg,
    updateMemberRole,
    removeMember,
    inviteMember,
    acceptInvite,
  }
}
