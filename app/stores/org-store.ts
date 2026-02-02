import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export const useOrgStore = defineStore("org", () => {
  const userStore = useUserStore()
  const projectStore = useProjectStore()

  const organizations = ref<Organization[]>([])
  const activeOrg = ref<Organization | null>(null)
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({
    getOrg: null,
    createOrg: null,
    updateOrg: null,
    deleteOrg: null,
    updateOrgMember: null,
    removeOrgMember: null,
    createInvite: null,
    acceptInvite: null,
    transferOrgOwnership: null,
  })

  const orgMembers = computed(() => activeOrg.value?.memberships ?? [])
  const orgProjects = computed(() => projectStore.projects.filter(p => p.orgId === activeOrg.value?.id) ?? [])
  const isOwner = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "OWNER")
  const isAdmin = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "ADMIN")

  async function getOrg(orgId: string) {
    loading.value = true
    errors.value.getOrg = null

    try {
      const res = await $fetch<{ organization: Organization }>(`/api/orgs/${orgId}`, { method: "GET", credentials: "include" })
      activeOrg.value = res.organization
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index === -1) {
        organizations.value.push(res.organization)
      }
      else {
        organizations.value[index] = res.organization
      }
      return res.organization
    }
    catch (err: any) {
      errors.value.getOrg = getErrorMessage(err, "Failed to get organization")
      console.error("getOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function setActiveOrg(orgId: string | null) {
    activeOrg.value = organizations.value.find(o => o.id === orgId) || null
  }

  async function createOrg(data: CreateOrgInput) {
    loading.value = true
    errors.value.createOrg = null

    try {
      const res = await $fetch<{ organization: Organization }>("/api/orgs", { method: "POST", body: data, credentials: "include" })
      organizations.value.push(res.organization)
      await userStore.getUser()
      return res.organization
    }
    catch (err: any) {
      errors.value.createOrg = getErrorMessage(err, "Failed to create organization")
      console.error("createOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrg(orgId: string, data: UpdateOrgInput) {
    loading.value = true
    errors.value.updateOrg = null

    try {
      const res = await $fetch<{ updatedOrg: Organization }>(`/api/orgs/${orgId}`, { method: "PUT", body: data, credentials: "include" })
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index !== -1) {
        organizations.value[index] = res.updatedOrg
      }
      if (activeOrg.value?.id === orgId) {
        activeOrg.value = res.updatedOrg
      }
      return res.updatedOrg
    }
    catch (err: any) {
      errors.value.updateOrg = getErrorMessage(err, "Failed to update organization")
      console.error("updateOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function transferOrgOwnership(orgId: string, data: { newOwnerId: string }) {
    loading.value = true
    errors.value.transferOrgOwnership = null

    try {
      const res = await $fetch(`/api/orgs/${orgId}/transfer-ownership`, { method: "POST", body: data, credentials: "include" })
      await getOrg(orgId)
      return res
    }
    catch (err: any) {
      errors.value.transferOrgOwnership = getErrorMessage(err, "Failed to transfer organization ownership")
      console.error("transferOrgOwnership error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteOrg(orgId: string) {
    loading.value = true
    errors.value.deleteOrg = null

    try {
      await $fetch(`/api/orgs/${orgId}`, { method: "DELETE", credentials: "include" })
      organizations.value = organizations.value.filter(o => o.id !== orgId)
      if (activeOrg.value?.id === orgId) {
        activeOrg.value = null
      }
    }
    catch (err: any) {
      errors.value.deleteOrg = getErrorMessage(err, "Failed to delete organization")
      console.error("deleteOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrgMember(orgId: string, memberId: string, data: UpdateOrgMemberInput) {
    loading.value = true
    errors.value.updateOrgMember = null

    try {
      const res = await $fetch<OrgMembership>(`/api/orgs/${orgId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.updateOrgMember = getErrorMessage(err, "Failed to update organization member")
      console.error("updateOrgMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function removeOrgMember(orgId: string, memberId: string) {
    loading.value = true
    errors.value.removeOrgMember = null

    try {
      await $fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
    }
    catch (err: any) {
      errors.value.removeOrgMember = getErrorMessage(err, "Failed to remove organization member")
      console.error("removeOrgMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createInvite(orgId: string, data: CreateInviteInput) {
    loading.value = true
    errors.value.createInvite = null

    try {
      const res = await $fetch(`/api/orgs/${orgId}/invite/create`, { method: "POST", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.createInvite = getErrorMessage(err, "Failed to create organization invite")
      console.error("createInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function acceptInvite(orgId: string, data: AcceptInviteInput) {
    loading.value = true
    errors.value.acceptInvite = null

    try {
      const res = await $fetch<{ organization: Organization, membership: OrgMembership }>(`/api/orgs/${orgId}/invite/accept`, { method: "POST", body: data, credentials: "include" })
      if (!organizations.value.some(o => o.id === orgId) && res.organization) {
        organizations.value.push(res.organization)
      }
      return res
    }
    catch (err: any) {
      errors.value.acceptInvite = getErrorMessage(err, "Failed to accept organization invite")
      console.error("acceptInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    errors,
    organizations,
    activeOrg,
    orgMembers,
    orgProjects,
    isOwner,
    isAdmin,
    setActiveOrg,
    getOrg,
    createOrg,
    updateOrg,
    transferOrgOwnership,
    deleteOrg,
    updateOrgMember,
    removeOrgMember,
    createInvite,
    acceptInvite,
  }
})
