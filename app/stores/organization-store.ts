import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export const useOrgStore = defineStore("org", () => {
  const organizations = ref<Organization[]>([])
  const activeOrg = ref<Organization | null>(null)
  const loading = ref(false)
  const errors = ref({
    getOrg: null,
    createOrg: null,
    updateOrg: null,
    deleteOrg: null,
    updateOrgMember: null,
    removeOrgMember: null,
    createInvite: null,
    acceptInvite: null,
  } as Record<string, string | null>)

  async function getOrg(orgId: string) {
    loading.value = true
    errors.value.getOrg = null
    try {
      const res = await $fetch<Organization>(`${API_URL}/org/${orgId}`, { method: "GET", credentials: "include" })
      activeOrg.value = res

      // Keep organizations synced
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index !== -1)
        organizations.value[index] = res
      else
        organizations.value.push(res)

      return res
    }
    catch (err: any) {
      errors.value.getOrg = err?.message || "Failed to get organization"
      console.error("getOrg error:", err)
    }
    finally {
      loading.value = false
    }
  }

  function setActiveOrg(org: Organization | null) {
    activeOrg.value = org
  }

  async function createOrg(data: CreateOrgInput) {
    loading.value = true
    errors.value.createOrg = null
    try {
      const res = await $fetch<Organization>(`${API_URL}/org`, { method: "POST", body: data, credentials: "include" })
      organizations.value.push(res)
      const userStore = useUserStore()
      await userStore.getUser()
      return res
    }
    catch (err: any) {
      errors.value.createOrg = err?.message || "Failed to create organization"
      console.error("createOrg error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrg(orgId: string, data: UpdateOrgInput) {
    loading.value = true
    errors.value.updateOrg = null
    try {
      const res = await $fetch<Organization>(`${API_URL}/org/${orgId}`, { method: "PUT", body: data, credentials: "include" })
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index !== -1)
        organizations.value[index] = res
      return res
    }
    catch (err: any) {
      errors.value.updateOrg = err?.message || "Failed to update organization"
      console.error("updateOrg error:", err)
    }
    finally { loading.value = false }
  }

  async function deleteOrg(orgId: string) {
    loading.value = true
    errors.value.deleteOrg = null
    try {
      await $fetch(`${API_URL}/org/${orgId}`, { method: "DELETE", credentials: "include" })
      organizations.value = organizations.value.filter(o => o.id !== orgId)
    }
    catch (err: any) {
      errors.value.deleteOrg = err?.message || "Failed to delete organization"
      console.error("deleteOrg error:", err)
    }
    finally { loading.value = false }
  }

  async function updateOrgMember(orgId: string, memberId: string, data: UpdateOrgMemberInput) {
    loading.value = true
    errors.value.updateOrgMember = null
    try {
      const res = await $fetch(`${API_URL}/org/${orgId}/members/${memberId}`, { method: "PUT", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.updateOrgMember = err?.message || "Failed to update organization member"
      console.error("updateOrgMember error:", err)
    }
    finally { loading.value = false }
  }

  async function removeOrgMember(orgId: string, memberId: string) {
    loading.value = true
    errors.value.removeOrgMember = null
    try {
      await $fetch(`${API_URL}/org/${orgId}/members/${memberId}`, { method: "DELETE", credentials: "include" })
    }
    catch (err: any) {
      errors.value.removeOrgMember = err?.message || "Failed to remove organization member"
      console.error("removeOrgMember error:", err)
    }
    finally { loading.value = false }
  }

  async function createInvite(orgId: string, data: CreateInviteInput) {
    loading.value = true
    errors.value.createInvite = null
    try {
      const res = await $fetch(`${API_URL}/org/${orgId}/invite/create`, { method: "POST", body: data, credentials: "include" })
      return res
    }
    catch (err: any) {
      errors.value.createInvite = err?.message || "Failed to create organization invite"
      console.error("createInvite error:", err)
    }
    finally { loading.value = false }
  }

  async function acceptInvite(orgId: string, data: AcceptInviteInput) {
    loading.value = true
    errors.value.acceptInvite = null
    try {
      const res = await $fetch<{ organization: Organization }>(`${API_URL}/org/${orgId}/invite/accept`, { method: "POST", body: data, credentials: "include" })
      if (!organizations.value.find(o => o.id === orgId) && res.organization) {
        organizations.value.push(res.organization)
      }
      return res
    }
    catch (err: any) {
      errors.value.acceptInvite = err?.message || "Failed to accept organization invite"
      console.error("acceptInvite error:", err)
    }
    finally { loading.value = false }
  }

  return {
    loading,
    errors,
    organizations,
    activeOrg,
    setActiveOrg,
    getOrg,
    createOrg,
    updateOrg,
    deleteOrg,
    updateOrgMember,
    removeOrgMember,
    createInvite,
    acceptInvite,
  }
})
