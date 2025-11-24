import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/schemas/audit-schema"

export const useAuditStore = defineStore("audit", () => {
  const auditLogs = ref<AuditLog[]>([])
  const pagination = ref<AuditLogsPagination | null>(null)
  const filters = ref<AuditFilters | null>(null)
  const currentFilters = ref<GetAuditLogsInput>({ page: 1, limit: 20 })
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({ getAuditLogs: null, deleteAuditLogs: null })

  async function getAuditLogs(orgId: string, params?: GetAuditLogsInput) {
    loading.value = true
    errors.value.getAuditLogs = null

    try {
      const queryParams = new URLSearchParams()
      const effectiveParams = params || currentFilters.value
      for (const [key, value] of Object.entries(effectiveParams)) {
        if (value !== undefined && value !== null)
          queryParams.append(key, String(value))
      }

      const res = await $fetch<{ auditLogs: AuditLog[], pagination: AuditLogsPagination, filters: AuditFilters }>(`${API_URL}/org/${orgId}/audit${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, { method: "GET", credentials: "include" })
      auditLogs.value = res.auditLogs as AuditLog[]
      pagination.value = res.pagination
      filters.value = res.filters
      if (params) {
        currentFilters.value = { ...currentFilters.value, ...params }
      }

      return res
    }
    catch (err: any) {
      errors.value.getAuditLogs = err.data.message || "Failed to fetch audit logs"
      console.error("getAuditLogs error:", err)
    }
    finally {
      loading.value = false
    }
  }

  async function deleteAuditLogs(orgId: string, data: DeleteAuditLogsInput) {
    loading.value = true
    errors.value.deleteAuditLogs = null

    try {
      await $fetch(`${API_URL}/org/${orgId}/audit`, { method: "DELETE", body: data, credentials: "include" })
    }
    catch (err: any) {
      errors.value.deleteAuditLogs = err.data.message || "Failed to delete audit logs"
      console.error("deleteAuditLogs error:", err)
    }
    finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<GetAuditLogsInput>) {
    currentFilters.value = { ...currentFilters.value, ...newFilters }
  }

  function resetFilters() {
    currentFilters.value = { page: 1, limit: 20 }
  }

  function nextPage(orgId: string) {
    if (pagination.value?.hasNext) {
      return getAuditLogs(orgId, { ...currentFilters.value, page: currentFilters.value.page! + 1 })
    }
  }

  function prevPage(orgId: string) {
    if (pagination.value?.hasPrev) {
      return getAuditLogs(orgId, { ...currentFilters.value, page: Math.max(1, currentFilters.value.page! - 1) })
    }
  }

  function goToPage(orgId: string, page: number) {
    return getAuditLogs(orgId, { ...currentFilters.value, page })
  }

  const getActions = [
    { label: "Organization Created", value: "organization.created" },
    { label: "Organization Updated", value: "organization.updated" },
    { label: "Organization Deleted", value: "organization.deleted" },
    { label: "Organization Invite Created", value: "organization.invite.created" },
    { label: "Organization Invite Accepted", value: "organization.invite.accepted" },
    { label: "Organization Member Added", value: "organization.member.added" },
    { label: "Organization Member Role Updated", value: "organization.member.role_updated" },
    { label: "Organization Member Removed", value: "organization.member.removed" },
    { label: "Project Created", value: "project.created" },
    { label: "Project Updated", value: "project.updated" },
    { label: "Project Deleted", value: "project.deleted" },
    { label: "Project Member Added", value: "project.member.added" },
    { label: "Project Member Role Updated", value: "project.member.role_updated" },
    { label: "Project Member Removed", value: "project.member.removed" },
    { label: "Secret Created", value: "secret.created" },
    { label: "Secret Updated", value: "secret.updated" },
    { label: "Secret Deleted", value: "secret.deleted" },
  ]

  function getTableHeaders() {
    return [
      { label: "Action", value: "action", icon: "ph:lightning" },
      { label: "Description", value: "description", icon: "ph:text-align-left" },
      { label: "User", value: "user", icon: "ph:user" },
      { label: "Date", value: "createdAt", icon: "ph:calendar" },
    ]
  }

  function getActionLabel(action: string): string {
    const actionItem = getActions.find(a => a.value === action)
    return actionItem?.label || action
  }

  function getResourceIcon(resource: string | null): string {
    if (!resource)
      return "ph:cube"

    const resourceMap: Record<string, string> = {
      organization: "ph:buildings",
      organization_invite: "ph:envelope",
      organization_member: "ph:users-three",
      project: "ph:folder",
      project_member: "ph:user-plus",
      secret: "ph:key",
    }

    return resourceMap[resource] || "ph:cube"
  }

  function formatDate(date: Date | string): string {
    const d = new Date(date)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  return {
    loading,
    errors,
    auditLogs,
    pagination,
    filters,
    currentFilters,
    getAuditLogs,
    deleteAuditLogs,
    updateFilters,
    resetFilters,
    nextPage,
    prevPage,
    goToPage,
    getActions,
    getTableHeaders,
    getActionLabel,
    getResourceIcon,
    formatDate,
  }
})
