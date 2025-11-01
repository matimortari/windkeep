import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/lib/schemas/audit-logs"

export const auditService = {
  /**
   * Get audit logs with filtering and pagination
   * @param orgId Organization ID
   * @param params Query parameters for filtering and pagination
   */
  getAuditLogs: async (orgId: string, params?: GetAuditLogsInput): Promise<AuditLogsResponse> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const res = await $fetch<AuditLogsResponse>(`${API_URL}/org/${orgId}/audit${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
      method: "GET",
      credentials: "include",
    })

    return res
  },

  /**
   * Get available filter options for audit logs
   * @param orgId Organization ID
   */
  getAuditFilters: async (orgId: string): Promise<AuditFilters> => {
    const res = await $fetch<AuditFilters>(`${API_URL}/org/${orgId}/audit/filters`, {
      method: "GET",
      credentials: "include",
    })

    return res
  },

  /**
   * Delete audit logs with filtering
   * @param orgId Organization ID
   * @param data Filter criteria for deletion
   */
  deleteAuditLogs: async (orgId: string, data: DeleteAuditLogsInput) => {
    const res = await $fetch(`${API_URL}/org/${orgId}/audit`, {
      method: "DELETE",
      body: data,
      credentials: "include",
    })

    return res
  },

}
