<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <SecretsProjectActions
      :project="project" :has-permission="isOwner(project?.id ?? '') || isAdmin(project?.id ?? '')"
      :has-pending-changes="hasPendingChanges" :all-visible="allVisible"
      :available-tags="availableTags" :active-tag-filter="activeTagFilter"
      @open-secrets-dialog="() => { selectSecret(null); openDialog('secrets') }"
      @open-editor-dialog="openDialog('raw')" @export="exportToEnv"
      @save="saveAllChanges" @toggle-all-visible="allVisible = !allVisible"
      @discard="discardAllChanges" @filter-by-tag="activeTagFilter = $event"
      @search="searchQuery = $event"
    />

    <Empty v-if="!displayedSecrets.length" message="Add a new secret or import from an .env file to get started." icon-name="ph:stack-minus-bold" />

    <div v-else class="flex max-h-screen flex-col gap-2">
      <SecretsTable
        :secrets="displayedSecrets" :project-id="project?.id ?? ''"
        :pending-changes="pendingChanges" :all-visible="allVisible"
        :active-tag-filter="activeTagFilter" @edit="handleEditSecret"
        @delete="handleDeleteSecret" @history="handleViewHistory"
        @filter-by-tag="activeTagFilter = $event"
      />
    </div>

    <SecretsCreateDialog :selected-secret="selectedSecret" :project-id="project?.id ?? ''" @close="closeDialog('secrets')" @save="handleSecretChange" />
    <SecretsEditorDialog :project-id="project?.id ?? ''" :secrets="displayedSecrets" @close="closeDialog('raw')" @save="handleImportSecrets" />
    <SecretsHistoryDialog :secret-id="historySecretId" :secret-key="historySecretKey" :project-id="project?.id ?? ''" @close="() => { closeDialog('history'); historySecretId = ''; historySecretKey = '' }" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const secretsStore = useSecretsStore()
const { openDialog, closeDialog, selectSecret, selectedSecret } = useUIState()
const { isOwner, isAdmin } = storeToRefs(projectStore)
const { secrets } = storeToRefs(secretsStore)
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const activeTagFilter = ref<string | null>(null)
const historySecretId = ref("")
const historySecretKey = ref("")
const searchQuery = ref("")
const allVisible = ref(false)
const pendingChanges = reactive<Map<string, PendingChange>>(new Map())
const hasPendingChanges = computed(() => pendingChanges.size > 0)

const displayedSecrets = computed(() => {
  const secretsMap = new Map<string, Secret>()
  for (const secret of secrets.value) {
    secretsMap.set(secret.key, secret)
  }
  for (const [_key, change] of pendingChanges) {
    secretsMap.set(change.secret.key, change.secret)
  }

  let list = [...secretsMap.values()]
  if (activeTagFilter.value) {
    list = list.filter(secret => secret.tags?.includes(activeTagFilter.value!))
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    list = list.filter(secret => secret.key.toLowerCase().includes(query) || secret.description?.toLowerCase().includes(query) || secret.values?.some(v => v.value.toLowerCase().includes(query)))
  }

  return list
})

const availableTags = computed(() => {
  const tags = new Set<string>()
  secrets.value.forEach(secret => secret.tags?.forEach(tag => tags.add(tag)))
  pendingChanges.forEach(change => change.secret.tags?.forEach(tag => tags.add(tag)))
  return Array.from(tags).sort()
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
  if (!displayedSecrets.value.some(s => s.key === key)) {
    return
  }

  const existingChange = pendingChanges.get(key)
  if (existingChange?.type === "delete") {
    if (existingChange.originalSecret && hasSecretChanges(existingChange.secret, existingChange.originalSecret)) {
      pendingChanges.set(key, { type: "update", secret: existingChange.secret, originalSecret: existingChange.originalSecret })
    }
    else {
      pendingChanges.delete(key)
    }

    return
  }

  if (existingChange?.type === "create") {
    pendingChanges.delete(key)
  }
  else {
    const originalSecret = secrets.value.find(s => s.key === key)
    if (originalSecret) {
      pendingChanges.set(key, { type: "delete", secret: existingChange?.secret ?? originalSecret, originalSecret })
    }
  }
}

function hasSecretChanges(secret: Secret, originalSecret: Secret): boolean {
  const normalizeValues = (values: SecretValue[] | undefined) => Array.from(values ?? [], v => `${v.environment}:${v.value}`).sort()
  return secret.description !== originalSecret.description || JSON.stringify(normalizeValues(secret.values)) !== JSON.stringify(normalizeValues(originalSecret.values))
}

function handleSecretChange(secret: Secret) {
  if (selectedSecret.value && selectedSecret.value.key !== secret.key) {
    const oldKey = selectedSecret.value.key
    if (pendingChanges.get(oldKey)?.type === "create") {
      pendingChanges.delete(oldKey)
    }
    else {
      const originalSecret = secrets.value.find(s => s.key === oldKey)
      if (originalSecret) {
        pendingChanges.set(oldKey, { type: "delete", secret: originalSecret, originalSecret })
      }
    }
    secret.id = ""
  }

  const existingSecret = secrets.value.find(s => s.key === secret.key)
  const existingChange = pendingChanges.get(secret.key)
  if (!existingSecret || existingChange?.type === "create") {
    pendingChanges.set(secret.key, { type: "create", secret })
  }
  else {
    pendingChanges.set(secret.key, { type: "update", secret, originalSecret: existingSecret })
  }

  closeDialog("secrets")
}

function handleImportSecrets(importedSecrets: Secret[], removedKeys: { key: string, environment: Environment }[]) {
  closeDialog("raw")

  for (const importedSecret of importedSecrets) {
    const existingSecret = secrets.value.find(s => s.key === importedSecret.key)
    const pendingChange = pendingChanges.get(importedSecret.key)
    if (!existingSecret && !pendingChange) {
      pendingChanges.set(importedSecret.key, { type: "create", secret: importedSecret as unknown as Secret })
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
        pendingChanges.set(importedSecret.key, { type: "create", secret: mergedSecret })
      }
      else {
        pendingChanges.set(importedSecret.key, { type: "update", secret: mergedSecret, originalSecret: existingSecret })
      }
    }
  }
  for (const { key, environment } of removedKeys) {
    const existingSecret = secrets.value.find(s => s.key === key)
    if (!existingSecret) {
      continue
    }

    const baseSecret = pendingChanges.get(key)?.secret || existingSecret
    const updatedValues = (baseSecret.values || []).filter(v => v.environment !== environment)
    if (updatedValues.length === 0) {
      pendingChanges.set(key, { type: "delete", secret: existingSecret, originalSecret: existingSecret })
    }
    else {
      pendingChanges.set(key, { type: "update", secret: { ...baseSecret, values: updatedValues }, originalSecret: existingSecret })
    }
  }
}

async function saveAllChanges() {
  if (!project.value?.id) {
    return
  }

  const { succeeded } = await secretsStore.saveAllSecretChanges(project.value.id, pendingChanges)
  succeeded.forEach(key => pendingChanges.delete(key))
}

function discardAllChanges() {
  if (!confirm("Are you sure you want to discard all pending changes?")) {
    return
  }
  pendingChanges.clear()
}

function exportToEnv(env: string | null | undefined) {
  if (!env || !project.value?.id) {
    return { success: false, error: "Environment or project not specified" }
  }

  const filteredSecrets = secrets.value.filter((s: Secret) => s.projectId === project.value?.id).map((s: Secret) => {
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
  a.click()
  return { success: true }
}

onBeforeRouteLeave(() => {
  if (hasPendingChanges.value) {
    return confirm("You have unsaved changes. Are you sure you want to leave?")
  }

  return true
})

// Get secrets and set page metadata when project changes
watch(() => project.value?.id, async (id) => {
  if (!id) {
    return
  }

  allVisible.value = false
  secrets.value = []
  await secretsStore.getProjectSecrets(id)

  useHead({
    title: `${project.value?.name}`,
    link: [{ rel: "canonical", href: `${baseURL}/${id}` }],
    meta: [{ name: "description", content: `${project.value?.name} project page.` }],
  })
}, { immediate: true })

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
