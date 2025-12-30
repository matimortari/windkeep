import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export function useEnvFile(projectRef: Ref<Project | undefined>) {
  const projectStore = useProjectStore()
  const projectSecrets = computed(() => projectStore.secrets)

  const mergeValues = (existing: SecretValue[], incoming: { environment: Environment, value: string }[]): { environment: Environment, value: string }[] => {
    const map = new Map<Environment, string>()
    for (const v of existing) {
      map.set(v.environment, v.value)
    }

    for (const v of incoming) {
      map.set(v.environment, v.value)
    }

    return Array.from(map.entries()).map(([environment, value]) => ({
      environment,
      value,
    }))
  }

  const importSingleSecret = async (secret: CreateSecretInput) => {
    if (!secret.key) {
      throw new Error("Secret key is required")
    }

    const currentProjectId = projectRef.value?.id
    if (!currentProjectId) {
      throw new Error("Project ID not available")
    }

    const existing = projectSecrets.value.find(s => s.key === secret.key && s.projectId === currentProjectId)
    if (existing) {
      const mergedValues = mergeValues(existing.values ?? [], secret.values ?? [])
      const payload: UpdateSecretInput = { values: mergedValues }
      if (secret.description !== undefined) {
        payload.description = secret.description
      }
      return await projectStore.updateProjectSecret(currentProjectId, existing.id!, payload)
    }
    else {
      const payload: CreateSecretInput = {
        key: secret.key,
        description: secret.description ?? "",
        projectId: currentProjectId,
        values: secret.values ?? [],
      }
      return await projectStore.createProjectSecret(currentProjectId, payload)
    }
  }

  const importFromEnv = async (importedSecrets: CreateSecretInput[]): Promise<{ success: number, failed: number, errors: string[] }> => {
    if (!importedSecrets?.length) {
      return { success: 0, failed: 0, errors: ["No secrets to import"] }
    }

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

    const currentProjectId = projectRef.value?.id
    if (currentProjectId) {
      await projectStore.getProjectSecrets(currentProjectId)
    }

    return { success: successCount, failed: failedCount, errors }
  }

  const exportToEnv = (env: string | null | undefined) => {
    const currentProjectId = projectRef.value?.id
    if (!env || !currentProjectId) {
      return { success: false, error: "Environment or project not specified" }
    }

    const filteredSecrets = projectSecrets.value
      .filter(s => s.projectId === currentProjectId)
      .map((s) => {
        const value = s.values?.find((v: SecretValue) => v.environment.toLowerCase() === env.toLowerCase())?.value
        return value ? `${s.key}="${value}"` : null
      })
      .filter(Boolean)
      .join("\n")
    if (!filteredSecrets) {
      return { success: false, error: "No secrets found for this environment" }
    }

    try {
      const blob = new Blob([filteredSecrets], { type: "text/plain" })
      const projectName = projectRef.value?.name?.toLowerCase().replaceAll(/\s+/g, "-").replaceAll(/[^\w.-]/g, "")
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `.env.${projectName}.${env.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      return { success: true }
    }
    catch (err: any) {
      return { success: false, error: err.data?.message || "Failed to export secrets" }
    }
  }

  return { importFromEnv, exportToEnv }
}
