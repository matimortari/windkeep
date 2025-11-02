import type { DeleteAuditLogsInput, GetAuditLogsInput } from "#shared/lib/schemas/audit-logs"

export const auditService = {
  /**
   * Get audit logs with filtering and pagination
   * @param orgId Organization ID
   * @param params Query parameters for filtering and pagination
   */
  getAuditLogs: async (orgId: string, params?: GetAuditLogsInput) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }
    const res = await $fetch(`${API_URL}/org/${orgId}/audit${queryParams.toString() ? `?${queryParams.toString()}` : ""}`, {
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
