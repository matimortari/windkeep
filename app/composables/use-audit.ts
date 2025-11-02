import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/lib/schemas/audit-logs"

export function useAudit() {
  const auditStore = useAuditStore()

  const auditLogs = computed(() => auditStore.auditLogs)
  const pagination = computed(() => auditStore.pagination)
  const filters = computed(() => auditStore.filters)
  const currentFilters = computed(() => auditStore.currentFilters)
  const loading = computed(() => auditStore.loading)
  const errors = computed(() => auditStore.errors)

  async function fetchAuditLogs(orgId: string, params?: GetAuditLogsInput) {
    return await auditStore.getAuditLogs(orgId, params)
  }

  async function applyFilters(orgId: string, filters: GetAuditLogsInput) {
    auditStore.updateFilters(filters)
    return await auditStore.getAuditLogs(orgId, filters)
  }

  async function deleteLogs(orgId: string, data: DeleteAuditLogsInput) {
    return await auditStore.deleteAuditLogs(orgId, data)
  }

  async function nextPage(orgId: string) {
    return await auditStore.nextPage(orgId)
  }

  async function prevPage(orgId: string) {
    return await auditStore.prevPage(orgId)
  }

  async function goToPage(orgId: string, page: number) {
    return await auditStore.goToPage(orgId, page)
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

  function formatMetadata(metadata: any): string {
    if (!metadata)
      return ""

    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata)
      }
      catch {
        return metadata
      }
    }

    if (typeof metadata === "object") {
      const entries = Object.entries(metadata)
      if (entries.length === 0)
        return ""

      return entries
        .map(([key, value]) => {
          const displayKey = key.replace(/([A-Z])/g, " $1").toLowerCase()
          return `<strong>${displayKey}:</strong> ${value}`
        })
        .join(", ")
    }

    return String(metadata)
  }

  function getTableHeaders() {
    return [
      { label: "Action", value: "action", icon: "ph:lightning-bold" },
      { label: "Resource", value: "resource", icon: "ph:database-bold" },
      { label: "Metadata", value: "metadata", icon: "ph:info-bold" },
      { label: "User", value: "user", icon: "ph:user-bold" },
      { label: "Date", value: "createdAt", icon: "ph:calendar-bold" },
    ]
  }

  const getActions = [
    { label: "Created", value: "CREATE" },
    { label: "Updated", value: "UPDATE" },
    { label: "Deleted", value: "DELETE" },
    { label: "Viewed", value: "VIEW" },
    { label: "Exported", value: "EXPORT" },
    { label: "Imported", value: "IMPORT" },
    { label: "Invited", value: "INVITE" },
    { label: "Joined", value: "JOIN" },
    { label: "Left", value: "LEAVE" },
    { label: "Removed", value: "REMOVE" },
  ]

  return {
    auditLogs,
    pagination,
    filters,
    currentFilters,
    loading,
    errors,
    fetchAuditLogs,
    applyFilters,
    deleteLogs,
    nextPage,
    prevPage,
    goToPage,
    formatDate,
    formatMetadata,
    getTableHeaders,
    getActions,
  }
}
