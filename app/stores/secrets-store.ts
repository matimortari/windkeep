import type { CreateSecretInput, UpdateSecretInput } from "#shared/schemas/secret-schema"

export const useSecretsStore = defineStore("secrets", () => {
  const toast = useToast()
  const secrets = ref<Secret[]>([])
  const loading = ref(false)

  async function getProjectSecrets(projectId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ decryptedSecrets: Secret[] }>(`/api/projects/${projectId}/secrets`, { method: "GET", credentials: "include" })
      secrets.value = Array.isArray(res.decryptedSecrets) ? res.decryptedSecrets : []
      return secrets.value
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to get project secrets")
      toast.error(message)
      console.error("getProjectSecrets error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function createProjectSecret(projectId: string, data: CreateSecretInput, silent = false) {
    loading.value = true

    try {
      const res = await $fetch<{ decryptedSecret: Secret }>(`/api/projects/${projectId}/secrets`, { method: "POST", body: data, credentials: "include" })
      secrets.value.push(res.decryptedSecret)
      if (!silent) {
        toast.success("Secret created successfully")
      }
      return res.decryptedSecret
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create project secret")
      if (!silent) {
        toast.error(message)
      }
      console.error("createProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateProjectSecret(projectId: string, secretId: string, data: UpdateSecretInput, silent = false) {
    loading.value = true

    try {
      const res = await $fetch<{ decryptedSecret: Secret }>(`/api/projects/${projectId}/secrets/${secretId}`, { method: "PUT", body: data, credentials: "include" })
      const index = secrets.value.findIndex(s => s.id === secretId)
      if (index !== -1) {
        secrets.value[index] = res.decryptedSecret
      }
      if (!silent) {
        toast.success("Secret updated successfully")
      }
      return res.decryptedSecret
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update project secret")
      if (!silent) {
        toast.error(message)
      }
      console.error("updateProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteProjectSecret(projectId: string, secretId: string, silent = false) {
    loading.value = true

    try {
      await $fetch(`/api/projects/${projectId}/secrets/${secretId}`, { method: "DELETE", credentials: "include" })
      secrets.value = secrets.value.filter(s => s.id !== secretId)
      if (!silent) {
        toast.success("Secret deleted successfully")
      }
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete project secret")
      if (!silent) {
        toast.error(message)
      }
      console.error("deleteProjectSecret error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function getSecretHistory(projectId: string, secretId: string) {
    loading.value = true

    try {
      const res = await $fetch<{ history: EnvironmentHistory[] }>(`/api/projects/${projectId}/secrets/history/${secretId}`, { method: "GET", credentials: "include" })
      return res.history
    }
    catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to get secret history")
      toast.error(message)
      console.error("getSecretHistory error:", err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function saveAllSecretChanges(projectId: string, changes: Map<string, PendingChange>) {
    const entries = [...changes.entries()]
    const failed: string[] = []
    const succeeded: string[] = []

    const results = await Promise.allSettled(entries.map(async ([key, change]) => {
      if (change.type === "create") {
        const { values, ...data } = change.secret
        await createProjectSecret(projectId, {
          key: data.key,
          description: data.description || "",
          tags: data.tags || [],
          projectId,
          values: (values || []).map(v => ({ environment: v.environment, value: v.value })),
        }, true)
      }
      else if (change.type === "update" && change.secret.id) {
        const { values, ...data } = change.secret
        await updateProjectSecret(projectId, change.secret.id, {
          description: data.description || "",
          tags: data.tags || undefined,
          values: values || [],
        }, true)
      }
      else if (change.type === "delete" && change.secret.id) {
        await deleteProjectSecret(projectId, change.secret.id, true)
      }
      return key
    }))

    results.forEach((result, index) => {
      const key = entries[index]![0]
      if (result.status === "fulfilled") {
        succeeded.push(key)
      }
      else {
        failed.push(key)
        console.error(`Failed to save secret "${key}":`, result.reason)
      }
    })

    if (failed.length && succeeded.length) {
      toast.warning(`${succeeded.length} secret(s) saved, ${failed.length} failed`)
    }
    else if (failed.length) {
      toast.error(`Failed to save ${failed.length} secret(s)`)
    }
    else {
      toast.success(`${succeeded.length} secret(s) saved successfully`)
    }

    return { succeeded, failed }
  }

  return {
    secrets,
    loading,
    getProjectSecrets,
    createProjectSecret,
    updateProjectSecret,
    deleteProjectSecret,
    getSecretHistory,
    saveAllSecretChanges,
  }
})
