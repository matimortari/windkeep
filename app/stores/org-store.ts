import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export const useOrgStore = defineStore("org", () => {
  const toast = useToast()
  const userStore = useUserStore()
  const projectStore = useProjectStore()

  const organizations = ref<Organization[]>([])
  const activeOrg = ref<Organization | null>(null)
  const loading = ref(false)

  const orgMembers = computed(() => activeOrg.value?.memberships ?? [])
  const orgProjects = computed(() => projectStore.projects.filter((p: Project) => p.orgId === activeOrg.value?.id) ?? [])

  const isOwner = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "OWNER")
  const isAdmin = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "ADMIN")

  async function getOrg(orgId: string) {
    loading.value = true

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
      const message = getErrorMessage(err, "Failed to get organization")
      toast.error(message)
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

    try {
      const res = await $fetch<{ organization: Organization }>("/api/orgs", { method: "POST", body: data, credentials: "include" })
      organizations.value.push(res.organization)
      await userStore.getUser()
      toast.success("Organization created successfully")
      return res.organization
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to create organization")
      toast.error(message)
      console.error("createOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrg(orgId: string, data: UpdateOrgInput) {
    loading.value = true

    try {
      const res = await $fetch<{ updatedOrg: Organization }>(`/api/orgs/${orgId}`, { method: "PUT", body: data, credentials: "include" })
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index !== -1) {
        organizations.value[index] = res.updatedOrg
      }
      if (activeOrg.value?.id === orgId) {
        activeOrg.value = res.updatedOrg
      }
      toast.success("Organization updated successfully")
      return res.updatedOrg
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to update organization")
      toast.error(message)
      console.error("updateOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function transferOrgOwnership(orgId: string, data: { newOwnerId: string }) {
    loading.value = true

    try {
      const res = await $fetch(`/api/orgs/${orgId}/transfer-ownership`, { method: "POST", body: data, credentials: "include" })
      await getOrg(orgId)
      toast.success("Organization ownership transferred successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to transfer organization ownership")
      toast.error(message)
      console.error("transferOrgOwnership error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteOrg(orgId: string) {
    loading.value = true

    try {
      await $fetch(`/api/orgs/${orgId}`, { method: "DELETE", credentials: "include" })
      organizations.value = organizations.value.filter(o => o.id !== orgId)
      if (activeOrg.value?.id === orgId) {
        activeOrg.value = null
      }
      toast.success("Organization deleted successfully")
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to delete organization")
      toast.error(message)
      console.error("deleteOrg error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrgMember(orgId: string, memberId: string, data: UpdateOrgMemberInput) {
    loading.value = true

    try {
      const res = await $fetch<OrgMembership>(`/api/orgs/${orgId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      toast.success("Member role updated successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to update organization member")
      toast.error(message)
      console.error("updateOrgMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function removeOrgMember(orgId: string, memberId: string) {
    loading.value = true

    try {
      await $fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
      toast.success("Member removed successfully")
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to remove organization member")
      toast.error(message)
      console.error("removeOrgMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createInvite(orgId: string, data: CreateInviteInput) {
    loading.value = true

    try {
      const res = await $fetch(`/api/orgs/${orgId}/invite/create`, { method: "POST", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to create organization invite")
      toast.error(message)
      console.error("createInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function acceptInvite(orgId: string, data: AcceptInviteInput) {
    loading.value = true

    try {
      const res = await $fetch<{ organization: Organization, membership: OrgMembership }>(`/api/orgs/${orgId}/invite/accept`, { method: "POST", body: data, credentials: "include" })
      if (!organizations.value.some(o => o.id === orgId) && res.organization) {
        organizations.value.push(res.organization)
      }
      toast.success("Invitation accepted successfully")
      return res
    }
    catch (err: any) {
      const message = getErrorMessage(err, "Failed to accept organization invite")
      toast.error(message)
      console.error("acceptInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
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
