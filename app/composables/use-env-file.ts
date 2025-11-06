import type { CreateSecretInput, UpdateSecretInput } from "#shared/lib/schemas/secret-schema"

export function useEnvFile(projectId: string) {
  const projectsStore = useProjectStore()

  const project = computed(() => projectsStore.projects.find(p => p.id === projectId))

  const handleImportFromEnv = async (importedSecrets: Secret[]): Promise<{ success: number, failed: number, errors: string[] }> => {
    if (!importedSecrets || importedSecrets.length === 0) {
      return { success: 0, failed: 0, errors: ["No secrets to import"] }
    }

    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    const results = await Promise.allSettled(importedSecrets.map(async (secret) => {
      if (!secret.key) {
        throw new Error("Secret key is required")
      }

      const existing = projectsStore.secrets.find((s: Secret) => s.key === secret.key && s.projectId === projectId)
      if (existing) {
        const existingValues = existing.values ?? []
        const newValues = secret.values ?? []

        const mergedValues = [...existingValues]
        newValues.forEach((newValue: SecretValue) => {
          const existingIndex = mergedValues.findIndex((v: SecretValue) => v.environment === newValue.environment)
          if (existingIndex >= 0) {
            mergedValues[existingIndex] = { ...mergedValues[existingIndex], value: newValue.value }
          }
          else {
            mergedValues.push(newValue)
          }
        })

        const updatePayload: UpdateSecretInput = {}
        if (secret.description !== undefined) {
          updatePayload.description = secret.description
        }
        updatePayload.values = mergedValues

        return await projectsStore.updateProjectSecret(projectId, existing.id!, updatePayload)
      }
      else {
        const createPayload: CreateSecretInput = {
          key: secret.key,
          description: secret.description ?? "",
          projectId,
        }
        createPayload.values = secret.values ?? []

        return await projectsStore.createProjectSecret(projectId, createPayload)
      }
    }))

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        failedCount++
        errors.push(`Failed to import "${importedSecrets[index]?.key}": ${result.reason?.message || "Unknown error"}`)
      }
      else {
        successCount++
      }
    })

    await projectsStore.getProjectSecrets(projectId)

    return { success: successCount, failed: failedCount, errors }
  }

  const handleExportToEnv = (env: string | null | undefined): { success: boolean, error?: string } => {
    if (!env) {
      return { success: false, error: "Environment not specified" }
    }

    const filteredSecrets = projectsStore.secrets
      .filter((s: Secret) => s.projectId === projectId)
      .map((s: Secret) => {
        const value = s.values?.find((v: SecretValue) => v.environment === env)?.value
        return value ? `${s.key}="${value}"` : null
      })
      .filter(Boolean)
      .join("\n")

    if (!filteredSecrets) {
      return { success: false, error: "No secrets found for this environment" }
    }

    try {
      const blob = new Blob([filteredSecrets], { type: "text/plain" })
      const projectName = project.value?.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w.-]/g, "") || "project"
      const fileName = `.env.${projectName}.${env.toLowerCase()}`
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: fileName,
      })
      a.click()

      setTimeout(() => URL.revokeObjectURL(url), 1000)

      return { success: true }
    }
    catch (error: any) {
      return { success: false, error: error?.message || "Failed to export secrets" }
    }
  }

  return { handleImportFromEnv, handleExportToEnv }
}
