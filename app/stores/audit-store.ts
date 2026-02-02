import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/schemas/audit-schema"

export const useAuditStore = defineStore("audit", () => {
  const auditLogs = ref<AuditLog[]>([])
  const pagination = ref<AuditLogsPagination | null>(null)
  const filters = ref<AuditFilters | null>(null)
  const currentFilters = ref<GetAuditLogsInput>({ page: 1, limit: 25 })
  const loading = ref(false)
  const errors = ref<Record<string, string | null>>({
    getAuditLogs: null,
    deleteAuditLogs: null,
  })

  const auditActions = computed(() => [
    { label: "Organization Created", value: "CREATE.ORG" },
    { label: "Organization Updated", value: "UPDATE.ORG" },
    { label: "Organization Ownership Transferred", value: "TRANSFER.ORG_OWNERSHIP" },
    { label: "Organization Invite Accepted", value: "ACCEPT.ORG_INVITE" },
    { label: "Organization Invite Created", value: "CREATE.ORG_INVITE" },
    { label: "Organization Member Removed", value: "REMOVE.ORG_MEMBER" },
    { label: "Organization Member Role Updated", value: "UPDATE.ORG_MEMBER_ROLE" },
    { label: "Project Created", value: "CREATE.PROJECT" },
    { label: "Project Deleted", value: "DELETE.PROJECT" },
    { label: "Project Updated", value: "UPDATE.PROJECT" },
    { label: "Project Member Removed", value: "REMOVE.PROJECT_MEMBER" },
    { label: "Project Member Role Updated", value: "UPDATE.PROJECT_MEMBER_ROLE" },
    { label: "Project Member Added", value: "ADD.PROJECT_MEMBER" },
    { label: "Secret Deleted", value: "DELETE.SECRET" },
    { label: "Secret Updated", value: "UPDATE.SECRET" },
    { label: "Secret Created", value: "CREATE.SECRET" },
  ])

  async function getAuditLogs(orgId: string, params?: GetAuditLogsInput) {
    loading.value = true
    errors.value.getAuditLogs = null

    try {
      const queryParams = new URLSearchParams()
      const effectiveParams = params || currentFilters.value
      for (const [key, value] of Object.entries(effectiveParams)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      }

      const res = await $fetch<{ auditLogs: AuditLog[], pagination: AuditLogsPagination, filters: AuditFilters }>(`/api/orgs/${orgId}/audit${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, { method: "GET", credentials: "include" })
      auditLogs.value = res.auditLogs
      pagination.value = res.pagination
      filters.value = res.filters
      if (params) {
        currentFilters.value = { ...currentFilters.value, ...params }
      }

      return res
    }
    catch (err: any) {
      errors.value.getAuditLogs = getErrorMessage(err, "Failed to fetch audit logs")
      console.error("getAuditLogs error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteAuditLogs(orgId: string, data: DeleteAuditLogsInput) {
    loading.value = true
    errors.value.deleteAuditLogs = null

    try {
      await $fetch(`/api/orgs/${orgId}/audit`, { method: "DELETE", body: data, credentials: "include" })
    }
    catch (err: any) {
      errors.value.deleteAuditLogs = getErrorMessage(err, "Failed to delete audit logs")
      console.error("deleteAuditLogs error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<GetAuditLogsInput>) {
    currentFilters.value = { ...currentFilters.value, ...newFilters, page: newFilters.page ?? 1 }
  }

  async function nextPage(orgId: string) {
    if (pagination.value?.hasNext) {
      return await getAuditLogs(orgId, { ...currentFilters.value, page: currentFilters.value.page! + 1 })
    }
  }

  async function prevPage(orgId: string) {
    if (pagination.value?.hasPrev) {
      return await getAuditLogs(orgId, { ...currentFilters.value, page: Math.max(1, currentFilters.value.page! - 1) })
    }
  }

  return {
    loading,
    errors,
    auditLogs,
    pagination,
    filters,
    currentFilters,
    auditActions,
    getAuditLogs,
    deleteAuditLogs,
    updateFilters,
    nextPage,
    prevPage,
  }
})
