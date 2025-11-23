import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/schemas/audit-schema"

export const useAuditStore = defineStore("audit", () => {
  const auditLogs = ref<AuditLog[]>([])
  const pagination = ref<AuditLogsPagination | null>(null)
  const filters = ref<AuditFilters | null>(null)
  const currentFilters = ref<GetAuditLogsInput>({ page: 1, limit: 20 })
  const loading = ref(false)
  const errors = ref<Record<"getAuditLogs" | "deleteAuditLogs", string | null>>({ getAuditLogs: null, deleteAuditLogs: null })

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

      const res = await $fetch<{ auditLogs: AuditLog[], pagination: AuditLogsPagination, filters: AuditFilters }>(`${API_URL}/org/${orgId}/audit${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
        method: "GET",
        credentials: "include",
      })

      auditLogs.value = res.auditLogs as AuditLog[]
      pagination.value = res.pagination
      filters.value = res.filters
      if (params)
        currentFilters.value = { ...currentFilters.value, ...params }

      return res
    }
    catch (err: any) {
      errors.value.getAuditLogs = err?.message || "Failed to fetch audit logs"
      console.error("getAuditLogs error:", err)
    }
    finally { loading.value = false }
  }

  async function deleteAuditLogs(orgId: string, data: DeleteAuditLogsInput) {
    loading.value = true
    errors.value.deleteAuditLogs = null
    try {
      const res = await $fetch(`${API_URL}/org/${orgId}/audit`, {
        method: "DELETE",
        body: data,
        credentials: "include",
      })

      await getAuditLogs(orgId, currentFilters.value)
      return res
    }
    catch (err: any) {
      errors.value.deleteAuditLogs = err?.message || "Failed to delete audit logs"
      console.error("deleteAuditLogs error:", err)
    }
    finally { loading.value = false }
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
  }
})
