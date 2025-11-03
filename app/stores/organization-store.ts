import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/lib/schemas/org-schema"

export const useOrganizationStore = defineStore("org", () => {
  const organizations = ref<Organization[]>([])
  const currentOrg = ref<any | null>(null)
  const loading = ref<boolean>(false)
  const errors = ref<Record<
    | "createOrg"
    | "updateOrg"
    | "deleteOrg"
    | "updateOrgMember"
    | "removeOrgMember"
    | "createInvite"
    | "acceptInvite",
    string | null
  >>({
    createOrg: null,
    updateOrg: null,
    deleteOrg: null,
    updateOrgMember: null,
    removeOrgMember: null,
    createInvite: null,
    acceptInvite: null,
  })

  async function createOrg(data: CreateOrgInput) {
    loading.value = true
    errors.value.createOrg = null

    try {
      const res = await organizationService.createOrg(data)
      organizations.value.push(res)
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
      const res = await organizationService.updateOrg(orgId, data)
      const index = organizations.value.findIndex(o => o.id === orgId)
      if (index !== -1) {
        organizations.value[index] = res
      }
      if (currentOrg.value?.id === orgId) {
        currentOrg.value = { ...currentOrg.value, ...res }
      }

      return res
    }
    catch (err: any) {
      errors.value.updateOrg = err?.message || "Failed to update organization"
      console.error("updateOrg error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function deleteOrg(orgId: string) {
    loading.value = true
    errors.value.deleteOrg = null

    try {
      await organizationService.deleteOrg(orgId)
      organizations.value = organizations.value.filter(o => o.id !== orgId)
      if (currentOrg.value?.id === orgId) {
        currentOrg.value = null
      }
    }
    catch (err: any) {
      errors.value.deleteOrg = err?.message || "Failed to delete organization"
      console.error("deleteOrg error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function updateOrgMember(orgId: string, memberId: string, data: UpdateOrgMemberInput) {
    loading.value = true
    errors.value.updateOrgMember = null

    try {
      const res = await organizationService.updateOrgMember(orgId, memberId, data)
      if (currentOrg.value?.id === orgId && currentOrg.value.members) {
        const index = currentOrg.value.members.findIndex((m: any) => m.userId === memberId)
        if (index !== -1) {
          currentOrg.value.members[index] = res
        }
      }

      return res
    }
    catch (err: any) {
      errors.value.updateOrgMember = err?.message || "Failed to update organization member"
      console.error("updateOrgMember error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function removeOrgMember(orgId: string, memberId: string) {
    loading.value = true
    errors.value.removeOrgMember = null

    try {
      await organizationService.removeOrgMember(orgId, memberId)
      if (currentOrg.value?.id === orgId && currentOrg.value.members) {
        currentOrg.value.members = currentOrg.value.members.filter((m: any) => m.userId !== memberId)
      }
    }
    catch (err: any) {
      errors.value.removeOrgMember = err?.message || "Failed to remove organization member"
      console.error("removeOrgMember error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function createInvite(orgId: string, data: CreateInviteInput) {
    loading.value = true
    errors.value.createInvite = null

    try {
      const res = await organizationService.createInvite(orgId, data)
      if (currentOrg.value?.id === orgId) {
        if (!currentOrg.value.invites) {
          currentOrg.value.invites = []
        }
        currentOrg.value.invites.push(res)
      }

      return res
    }
    catch (err: any) {
      errors.value.createInvite = err?.message || "Failed to create organization invite"
      console.error("createInvite error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function acceptInvite(orgId: string, data: AcceptInviteInput) {
    loading.value = true
    errors.value.acceptInvite = null

    try {
      const res = await organizationService.acceptInvite(orgId, data)
      const existingOrg = organizations.value.find(o => o.id === orgId)
      if (!existingOrg && res.organization) {
        organizations.value.push(res.organization)
      }

      return res
    }
    catch (err: any) {
      errors.value.acceptInvite = err?.message || "Failed to accept organization invite"
      console.error("acceptInvite error:", err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    errors,
    organizations,
    currentOrg,
    createOrg,
    updateOrg,
    deleteOrg,
    updateOrgMember,
    removeOrgMember,
    createInvite,
    acceptInvite,
  }
})
