import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/lib/schemas/audit-schema"

export function useAuditActions() {
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

      // Filter out common metadata fields that are already shown elsewhere
      const filteredEntries = entries.filter(([key]) =>
        !["ip", "userAgent"].includes(key),
      )

      if (filteredEntries.length === 0)
        return ""

      return filteredEntries
        .map(([key, value]) => {
          const displayKey = key.replace(/([A-Z])/g, " $1").toLowerCase()
          const displayValue = Array.isArray(value) ? value.join(", ") : String(value)
          return `<strong>${displayKey}:</strong> ${displayValue}`
        })
        .join(" • ")
    }

    return String(metadata)
  }

  const getActions = [
    // Organization actions
    { label: "Organization Created", value: "organization.created" },
    { label: "Organization Updated", value: "organization.updated" },
    { label: "Organization Deleted", value: "organization.deleted" },
    { label: "Organization Invite Created", value: "organization.invite.created" },
    { label: "Organization Invite Accepted", value: "organization.invite.accepted" },
    { label: "Organization Member Added", value: "organization.member.added" },
    { label: "Organization Member Role Updated", value: "organization.member.role_updated" },
    { label: "Organization Member Removed", value: "organization.member.removed" },

    // Project actions
    { label: "Project Created", value: "project.created" },
    { label: "Project Updated", value: "project.updated" },
    { label: "Project Deleted", value: "project.deleted" },
    { label: "Project Member Added", value: "project.member.added" },
    { label: "Project Member Role Updated", value: "project.member.role_updated" },
    { label: "Project Member Removed", value: "project.member.removed" },

    // Secret actions
    { label: "Secret Created", value: "secret.created" },
    { label: "Secret Updated", value: "secret.updated" },
    { label: "Secret Deleted", value: "secret.deleted" },
  ]

  function getTableHeaders() {
    return [
      { label: "Action", value: "action", icon: "ph:lightning-bold" },
      { label: "Description", value: "description", icon: "ph:text-align-left-bold" },
      { label: "User", value: "user", icon: "ph:user-bold" },
      { label: "Date", value: "createdAt", icon: "ph:calendar-bold" },
    ]
  }

  function getActionLabel(action: string): string {
    const actionItem = getActions.find(a => a.value === action)
    return actionItem?.label || action
  }

  function getResourceIcon(resource: string | null): string {
    if (!resource)
      return "ph:cube-bold"

    const resourceMap: Record<string, string> = {
      organization: "ph:buildings-bold",
      organization_invite: "ph:envelope-bold",
      organization_member: "ph:users-three-bold",
      project: "ph:folder-bold",
      project_member: "ph:user-plus-bold",
      secret: "ph:key-bold",
    }

    return resourceMap[resource] || "ph:cube-bold"
  }

  return {
    auditLogs,
    pagination,
    filters,
    currentFilters,
    loading,
    errors,
    getActions,
    fetchAuditLogs,
    applyFilters,
    deleteLogs,
    nextPage,
    prevPage,
    goToPage,
    formatDate,
    formatMetadata,
    getTableHeaders,
    getActionLabel,
    getResourceIcon,
  }
}
