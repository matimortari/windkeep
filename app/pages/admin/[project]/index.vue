<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <SecretsProjectActions
      :project="project" :has-permission="isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')"
      :has-pending-changes="hasPendingChanges" :all-visible="allVisible"
      @open-secrets-dialog="() => { selectSecret(null); openDialog('secrets') }" @open-editor-dialog="openDialog('raw')"
      @export="exportToEnv" @save="saveAllChanges"
      @toggle-all-visible="allVisible = !allVisible" @discard="discardAllChanges"
    />

    <Empty v-if="!displayedSecrets.length" message="Add a new secret or import from an .env file to get started." icon-name="ph:stack-minus-bold" />

    <div v-else class="flex max-h-screen flex-col gap-2">
      <SecretsTable
        :secrets="displayedSecrets" :project-id="project?.id ?? ''"
        :pending-changes="pendingChanges" :all-visible="allVisible"
        @edit="handleEditSecret" @delete="handleDeleteSecret"
        @history="handleViewHistory"
      />
    </div>

    <SecretsDialog :selected-secret="selectedSecret" :project-id="project?.id ?? ''" @close="closeDialog('secrets')" @save="handleSecretChange" />
    <SecretsEditorDialog :project-id="project?.id ?? ''" :secrets="displayedSecrets" @close="closeDialog('raw')" @save="handleImportSecrets" />
    <SecretsHistoryDialog :secret-id="historySecretId" :secret-key="historySecretKey" :project-id="project?.id ?? ''" @close="() => { closeDialog('history'); historySecretId = ''; historySecretKey = '' }" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { openDialog, closeDialog, selectSecret, selectedSecret } = useUIState()
const { secrets, isOwner, isAdmin } = storeToRefs(projectStore)
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const historySecretId = ref("")
const historySecretKey = ref("")
const allVisible = ref(false)
const pendingChanges = ref<Map<string, PendingChange>>(new Map())
const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

const displayedSecrets = computed(() => {
  const secretsMap = new Map<string, Secret>()
  for (const secret of secrets.value) {
    secretsMap.set(secret.key, secret)
  }
  for (const [_key, change] of pendingChanges.value) {
    secretsMap.set(change.secret.key, change.secret)
  }

  return [...secretsMap.values()]
})

function handleEditSecret(secret: Secret) {
  selectSecret(secret)
  openDialog("secrets")
}

function handleViewHistory(secret: Secret) {
  historySecretId.value = secret.id
  historySecretKey.value = secret.key
  openDialog("history")
}

function handleDeleteSecret(key: string) {
  const secret = displayedSecrets.value.find(s => s.key === key)
  if (!secret) {
    return
  }

  const existingChange = pendingChanges.value.get(key)
  if (existingChange?.type === "delete") {
    if (existingChange.originalSecret && hasSecretChanges(existingChange.secret, existingChange.originalSecret)) {
      pendingChanges.value.set(key, {
        type: "update",
        secret: existingChange.secret,
        originalSecret: existingChange.originalSecret,
      })
    }
    else {
      pendingChanges.value.delete(key)
    }

    return
  }

  if (existingChange?.type === "create") {
    pendingChanges.value.delete(key)
  }
  else {
    const originalSecret = secrets.value.find(s => s.key === key)
    if (originalSecret) {
      pendingChanges.value.set(key, {
        type: "delete",
        secret: existingChange?.secret ?? originalSecret,
        originalSecret,
      })
    }
  }
}

function hasSecretChanges(secret: Secret, originalSecret: Secret): boolean {
  const normalizeValues = (values: SecretValue[] | undefined) => Array.from(values ?? [], v => `${v.environment}:${v.value}`).sort()
  return secret.description !== originalSecret.description || JSON.stringify(normalizeValues(secret.values)) !== JSON.stringify(normalizeValues(originalSecret.values))
}

function handleSecretChange(secret: Secret) {
  const existingSecret = secrets.value.find(s => s.key === secret.key)
  const existingChange = pendingChanges.value.get(secret.key)
  if (!existingSecret || existingChange?.type === "create") {
    pendingChanges.value.set(secret.key, { type: "create", secret })
  }
  else {
    pendingChanges.value.set(secret.key, { type: "update", secret, originalSecret: existingSecret })
  }

  closeDialog("secrets")
}

function handleImportSecrets(importedSecrets: { key: string, description: string, projectId: string, values: { environment: Environment, value: string }[] }[], removedKeys: { key: string, environment: Environment }[]) {
  closeDialog("raw")

  // Upsert added/updated secrets
  for (const importedSecret of importedSecrets) {
    const existingSecret = secrets.value.find(s => s.key === importedSecret.key)
    const pendingChange = pendingChanges.value.get(importedSecret.key)
    if (!existingSecret && !pendingChange) {
      pendingChanges.value.set(importedSecret.key, { type: "create", secret: importedSecret as unknown as Secret })
    }
    else {
      const baseSecret = pendingChange?.secret || existingSecret!
      const mergedValues = [...(baseSecret.values || [])]
      for (const newValue of importedSecret.values || []) {
        const idx = mergedValues.findIndex(v => v.environment === newValue.environment)
        if (idx >= 0) {
          mergedValues[idx] = newValue as SecretValue
        }
        else {
          mergedValues.push(newValue as SecretValue)
        }
      }
      const mergedSecret: Secret = { ...baseSecret, values: mergedValues }
      if (!existingSecret) {
        pendingChanges.value.set(importedSecret.key, { type: "create", secret: mergedSecret })
      }
      else {
        pendingChanges.value.set(importedSecret.key, { type: "update", secret: mergedSecret, originalSecret: existingSecret })
      }
    }
  }

  // Handle removed env values
  for (const { key, environment } of removedKeys) {
    const existingSecret = secrets.value.find(s => s.key === key)
    if (!existingSecret) {
      continue
    }

    const pendingChange = pendingChanges.value.get(key)
    const baseSecret = pendingChange?.secret || existingSecret
    const updatedValues = (baseSecret.values || []).filter(v => v.environment !== environment)

    // If no values remain at all, mark as full delete
    if (updatedValues.length === 0) {
      pendingChanges.value.set(key, { type: "delete", secret: existingSecret, originalSecret: existingSecret })
    }
    else {
      pendingChanges.value.set(key, { type: "update", secret: { ...baseSecret, values: updatedValues }, originalSecret: existingSecret })
    }
  }
}

async function saveAllChanges() {
  if (!project.value?.id) {
    return
  }

  const projectId = project.value.id
  const changeEntries = [...pendingChanges.value.entries()]
  const failed: string[] = []
  const results = await Promise.allSettled(changeEntries.map(async ([key, change]) => {
    if (change.type === "create") {
      const { values, ...data } = change.secret
      await projectStore.createProjectSecret(projectId, {
        key: data.key,
        description: data.description || "",
        projectId,
        values: (values || []).map(v => ({ environment: v.environment, value: v.value })),
      })
    }
    else if (change.type === "update" && change.secret.id) {
      const { values, ...data } = change.secret
      await projectStore.updateProjectSecret(projectId, change.secret.id, {
        description: data.description || "",
        values: values || [],
      })
    }
    else if (change.type === "delete" && change.secret.id) {
      await projectStore.deleteProjectSecret(projectId, change.secret.id)
    }
    return key
  }))

  results.forEach((result, index) => {
    const key = changeEntries[index]![0]
    if (result.status === "fulfilled") {
      pendingChanges.value.delete(result.value)
    }
    else {
      failed.push(key)
      console.error(`Failed to save secret "${key}":`, result.reason)
    }
  })

  await projectStore.getProjectSecrets(projectId)
}

function discardAllChanges() {
  if (!confirm("Are you sure you want to discard all pending changes?")) {
    return
  }

  pendingChanges.value.clear()
}

function exportToEnv(env: string | null | undefined) {
  const currentProjectId = project.value?.id
  if (!env || !currentProjectId) {
    return { success: false, error: "Environment or project not specified" }
  }

  const filteredSecrets = secrets.value.filter((s: Secret) => s.projectId === currentProjectId).map((s: Secret) => {
    const value = s.values?.find((v: SecretValue) => v.environment.toLowerCase() === env.toLowerCase())?.value
    return value ? `${s.key}="${value}"` : null
  }).filter(Boolean).join("\n")
  if (!filteredSecrets) {
    return { success: false, error: "No secrets found for this environment" }
  }

  const blob = new Blob([filteredSecrets], { type: "text/plain" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `.env.${project.value?.slug}.${env.toLowerCase()}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  return { success: true }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (hasPendingChanges.value) {
    next(confirm("You have unsaved changes. Are you sure you want to leave?"))
  }
  else {
    next()
  }
})

// Get secrets and set page metadata when project changes
watch(() => project.value?.id, async (id) => {
  if (!id) {
    return
  }

  allVisible.value = false
  secrets.value = []
  await projectStore.getProjectSecrets(id)

  useHead({
    title: `${project.value?.name}`,
    link: [{ rel: "canonical", href: `${baseURL}/${id}` }],
    meta: [{ name: "description", content: `${project.value?.name} project page.` }],
  })
}, { immediate: true })

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
