import type { GetAuditLogsInput } from "#shared/schemas/audit-schema"
import type { AcceptInviteInput, CreateInviteInput, CreateOrgInput, UpdateOrgInput, UpdateOrgMemberInput } from "#shared/schemas/org-schema"

export const useOrgStore = defineStore("org", () => {
  const toast = useToast()
  const userStore = useUserStore()
  const projectStore = useProjectStore()
  const organizations = ref<Organization[]>([])
  const activeOrg = ref<Organization | null>(null)
  const invitations = ref<Invitation[]>([])
  const loading = ref(false)
  const auditLogs = ref<AuditLog[]>([])
  const auditPagination = ref<AuditLogsPagination | null>(null)
  const auditFilters = ref<AuditFilters | null>(null)
  const currentAuditFilters = ref<GetAuditLogsInput>({ page: 1, limit: 25 })

  const orgMembers = computed(() => activeOrg.value?.memberships ?? [])
  const orgProjects = computed(() => projectStore.projects.filter((p: Project) => p.orgId === activeOrg.value?.id) ?? [])

  const isOwner = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "OWNER")
  const isAdmin = computed(() => userStore.user?.orgMemberships?.find(m => m.isActive)?.role === "ADMIN")

  const auditActions = computed(() => [
    { label: "Organization Created", value: "CREATE.ORG" },
    { label: "Organization Updated", value: "UPDATE.ORG" },
    { label: "Organization Ownership Transferred", value: "TRANSFER.ORG_OWNERSHIP" },
    { label: "Organization Invite Accepted", value: "ACCEPT.ORG_INVITE" },
    { label: "Organization Invite Created", value: "CREATE.ORG_INVITE" },
    { label: "Organization Invite Revoked", value: "REVOKE.ORG_INVITE" },
    { label: "Organization Member Removed", value: "REMOVE.ORG_MEMBER" },
    { label: "Organization Member Role Updated", value: "UPDATE.ORG_MEMBER_ROLE" },
    { label: "Project Created", value: "CREATE.PROJECT" },
    { label: "Project Deleted", value: "DELETE.PROJECT" },
    { label: "Project Updated", value: "UPDATE.PROJECT" },
    { label: "Project Member Removed", value: "REMOVE.PROJECT_MEMBER" },
    { label: "Project Member Role Updated", value: "UPDATE.PROJECT_MEMBER_ROLE" },
    { label: "Project Member Added", value: "ADD.PROJECT_MEMBER" },
    { label: "Service Token Created", value: "CREATE.SERVICE_TOKEN" },
    { label: "Service Token Revoked", value: "REVOKE.SERVICE_TOKEN" },
    { label: "Secret Deleted", value: "DELETE.SECRET" },
    { label: "Secret Updated", value: "UPDATE.SECRET" },
    { label: "Secret Created", value: "CREATE.SECRET" },
  ])

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
    catch (err: unknown) {
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
    catch (err: unknown) {
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
    catch (err: unknown) {
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
      const res = await $fetch<{ success: boolean, message: string, newOwner: { id: string, name: string, email: string } }>(`/api/orgs/${orgId}/transfer-ownership`, { method: "POST", body: data, credentials: "include" })
      await getOrg(orgId)
      toast.success("Organization ownership transferred successfully")
      return res
    }
    catch (err: unknown) {
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
    catch (err: unknown) {
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
    catch (err: unknown) {
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
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to remove organization member")
      toast.error(message)
      console.error("removeOrgMember error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getInvitations(orgId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ invitations: Invitation[] }>(`/api/orgs/${orgId}/invitations`, { method: "GET", credentials: "include" })
      invitations.value = res.invitations
      return res.invitations
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to load open organization invitations")
      toast.error(message)
      console.error("getInvitations error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createInvite(orgId: string, data: CreateInviteInput) {
    loading.value = true

    try {
      const res = await $fetch<{ invitation: Invitation, inviteUrl: string }>(`/api/orgs/${orgId}/invitations`, { method: "POST", body: data, credentials: "include" })
      const idx = invitations.value.findIndex(i => i.id === res.invitation.id)
      if (idx !== -1) {
        invitations.value[idx] = res.invitation
      }
      else {
        invitations.value.push(res.invitation)
      }

      toast.success("Invitation created successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create organization invite")
      toast.error(message)
      console.error("createInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function revokeInvite(orgId: string, inviteId: string) {
    loading.value = true
    try {
      await $fetch(`/api/orgs/${orgId}/invitations/${inviteId}`, { method: "DELETE", credentials: "include" })
      invitations.value = invitations.value.filter(i => i.id !== inviteId)
      toast.success("Invitation revoked successfully")
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to revoke invitation")
      toast.error(message)
      console.error("revokeInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function acceptInvite(orgId: string, data: AcceptInviteInput) {
    loading.value = true

    try {
      const res = await $fetch<{ organization: Organization, membership: OrgMembership }>(`/api/orgs/${orgId}/invitations/accept`, { method: "POST", body: data, credentials: "include" })
      if (res.organization && !organizations.value.some(o => o.id === res.organization.id)) {
        organizations.value.push(res.organization)
      }
      toast.success("Invitation accepted successfully")
      return res
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to accept organization invite")
      toast.error(message)
      console.error("acceptInvite error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getAuditLogs(orgId: string, params?: GetAuditLogsInput) {
    loading.value = true

    try {
      const queryParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params || currentAuditFilters.value)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      }

      const res = await $fetch<{ data: { auditLogs: AuditLog[], filters: AuditFilters, pagination: AuditLogsPagination } }>(`/api/orgs/${orgId}/audit?${queryParams.toString()}`, { method: "GET", credentials: "include" })
      auditLogs.value = res.data.auditLogs
      auditFilters.value = res.data.filters
      auditPagination.value = res.data.pagination
      return res.data
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch audit logs")
      toast.error(message)
      console.error("getAuditLogs error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<GetAuditLogsInput>) {
    currentAuditFilters.value = { ...currentAuditFilters.value, ...newFilters, page: newFilters.page ?? 1 }
  }

  async function nextPage(orgId: string) {
    if (auditPagination.value?.hasNext) {
      return await getAuditLogs(orgId, { ...currentAuditFilters.value, page: currentAuditFilters.value.page! + 1 })
    }
  }

  async function prevPage(orgId: string) {
    if (auditPagination.value?.hasPrev) {
      return await getAuditLogs(orgId, { ...currentAuditFilters.value, page: Math.max(1, currentAuditFilters.value.page! - 1) })
    }
  }

  return {
    loading,
    organizations,
    activeOrg,
    invitations,
    auditLogs,
    auditPagination,
    auditFilters,
    currentAuditFilters,
    auditActions,
    orgMembers,
    orgProjects,
    isOwner,
    isAdmin,
    setActiveOrg,
    getOrg,
    createOrg,
    updateOrg,
    transferOrgOwnership,
    getAuditLogs,
    deleteOrg,
    updateOrgMember,
    removeOrgMember,
    getInvitations,
    createInvite,
    revokeInvite,
    acceptInvite,
    updateFilters,
    nextPage,
    prevPage,
  }
})
