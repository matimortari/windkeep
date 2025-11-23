import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export function useEnvFile(projectId: string) {
  const projectStore = useProjectStore()
  const projectSecrets = computed(() => projectStore.secrets)

  const mergeValues = (existingValues: SecretValue[], newValues: SecretValue[]): SecretValue[] => {
    const merged = [...existingValues]
    for (const newValue of newValues) {
      const idx = merged.findIndex((v: SecretValue) => v.environment === newValue.environment)
      if (idx >= 0)
        merged[idx] = { ...merged[idx], value: newValue.value } as SecretValue
      else merged.push(newValue)
    }
    return merged
  }

  const importSingleSecret = async (secret: Secret) => {
    if (!secret.key)
      throw new Error("Secret key is required")

    const existing = projectSecrets.value.find(s => s.key === secret.key && s.projectId === projectId)
    if (existing) {
      const mergedValues = mergeValues(existing.values ?? [], secret.values ?? [])
      const payload: UpdateSecretInput = { values: mergedValues }
      if (secret.description !== undefined)
        payload.description = secret.description
      return await projectStore.updateProjectSecret(projectId, existing.id!, payload)
    }
    else {
      const payload: CreateSecretInput = {
        key: secret.key,
        description: secret.description ?? "",
        projectId,
        values: secret.values ?? [],
      }
      return await projectStore.createProjectSecret(projectId, payload)
    }
  }

  const importFromEnv = async (importedSecrets: Secret[]): Promise<{ success: number, failed: number, errors: string[] }> => {
    if (!importedSecrets?.length)
      return { success: 0, failed: 0, errors: ["No secrets to import"] }

    const results = await Promise.allSettled(importedSecrets.map(importSingleSecret))

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        failedCount++
        errors.push(`Failed to import "${importedSecrets[i]?.key}": ${result.reason?.message || "Unknown error"}`)
      }
      else {
        successCount++
      }
    }

    await projectStore.getProjectSecrets(projectId)
    return { success: successCount, failed: failedCount, errors }
  }

  const exportToEnv = (env: string | null | undefined): { success: boolean, error?: string } => {
    if (!env)
      return { success: false, error: "Environment not specified" }

    const filteredSecrets = projectSecrets.value
      .filter(s => s.projectId === projectId)
      .map((s) => {
        const value = s.values?.find((v: SecretValue) => v.environment === env)?.value
        return value ? `${s.key}="${value}"` : null
      })
      .filter(Boolean)
      .join("\n")

    if (!filteredSecrets)
      return { success: false, error: "No secrets found for this environment" }

    try {
      const blob = new Blob([filteredSecrets], { type: "text/plain" })
      const projectName = projectStore.projects.find(p => p.id === projectId)?.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w.-]/g, "")
      const fileName = `.env.${projectName}.${env.toLowerCase()}`
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: fileName })
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      return { success: true }
    }
    catch (error: any) {
      return { success: false, error: error?.message || "Failed to export secrets" }
    }
  }

  return { importFromEnv, exportToEnv }
}
