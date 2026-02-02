<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="flex flex-col items-start gap-4 border-b py-2 md:flex-row md:items-center md:justify-between">
      <div class="navigation-group">
        <nuxt-link to="/admin/projects" aria-label="Go back" class="flex items-center">
          <icon name="ph:arrow-left" size="30" class="text-muted-foreground hover:text-primary" />
        </nuxt-link>
        <h2 class="max-w-lg truncate">
          {{ project?.name }}
        </h2>
      </div>

      <nav class="navigation-group w-full flex-1 justify-start md:justify-end" aria-label="Project Actions">
        <button class="btn-primary" aria-label="Add New Secret" @click="() => { isSecretsDialogOpen = true; selectedSecret = null }">
          <span class="hidden md:block">Add New Secret</span>
          <icon name="ph:plus" size="20" />
        </button>

        <button class="btn-secondary" aria-label="Import Secrets from .env File" @click="() => { isEnvDialogOpen = true; selectedSecret = null }">
          <span>Import</span>
          <icon name="ph:upload" size="20" />
        </button>

        <div ref="dropdownRef" class="relative">
          <button class="btn-secondary" aria-label="Export Secrets to .env File" @click="isDropdownOpen = !isDropdownOpen">
            <span>Export</span>
            <icon name="ph:download" size="20" />
          </button>

          <transition name="dropdown" mode="out-in">
            <ul v-if="isDropdownOpen" class="dropdown-menu -left-8 overflow-y-auto text-sm" role="menu" aria-label="Export environments">
              <li v-for="env in ENVIRONMENTS" :key="env.value" class="rounded-sm capitalize">
                <button role="menuitem" class="w-full p-2 text-left hover:bg-muted" @click="exportToEnv(env.value); isDropdownOpen = false">
                  {{ capitalizeFirst(env.label) }}
                </button>
              </li>
            </ul>
          </transition>
        </div>

        <nuxt-link :to="`/admin/${project?.slug}/settings`" class="btn">
          <icon name="ph:gear" size="20" />
        </nuxt-link>

        <button v-if="hasPendingChanges" class="btn-success" aria-label="Save All Changes" @click="saveAllChanges">
          <icon name="ph:floppy-disk" size="20" />
        </button>

        <button v-if="hasPendingChanges" class="btn-danger" aria-label="Discard Changes" @click="discardAllChanges">
          <icon name="ph:x" size="20" />
        </button>
      </nav>
    </header>

    <Empty v-if="!displayedSecrets.length" message="Add a new secret or import from an .env file to get started." icon-name="ph:stack-minus" />

    <div v-if="displayedSecrets.length" class="max-h-screen overflow-y-auto">
      <ProjectSecretsTable
        :secrets="displayedSecrets" :project-id="project?.id ?? ''"
        :pending-changes="pendingChanges" @edit="handleEditSecret"
        @delete="handleDeleteSecret"
      />
    </div>

    <ProjectSecretsDialog
      :is-open="isSecretsDialogOpen" :selected-secret="selectedSecret"
      :project-id="project?.id ?? ''" @close="() => { isSecretsDialogOpen = false; selectedSecret = null }"
      @save="handleSecretChange"
    />

    <ProjectSecretsImportDialog
      :is-open="isEnvDialogOpen" :project-id="project?.id ?? ''"
      :secrets="displayedSecrets" @close="() => { isEnvDialogOpen = false; selectedSecret = null }"
      @save="handleImportSecrets"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { secrets } = storeToRefs(projectStore)
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const { exportToEnv } = useEnvFile(project)
const selectedSecret = ref<Secret | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isSecretsDialogOpen = ref(false)
const isEnvDialogOpen = ref(false)
const isDropdownOpen = ref(false)
const pendingChanges = ref<Map<string, PendingChange>>(new Map())
const hasPendingChanges = computed(() => pendingChanges.value.size > 0)

const displayedSecrets = computed(() => {
  const secretsMap = new Map<string, Secret>()

  for (const secret of secrets.value) {
    secretsMap.set(secret.key, secret)
  }

  for (const [key, change] of pendingChanges.value.entries()) {
    if (change.type === "delete") {
      secretsMap.set(key, change.secret)
    }
    else {
      secretsMap.set(key, change.secret)
    }
  }

  return Array.from(secretsMap.values())
})

useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
}, { escapeKey: true })

function handleEditSecret(secret: Secret) {
  isSecretsDialogOpen.value = true
  selectedSecret.value = secret
}

function handleDeleteSecret(key: string) {
  const secret = displayedSecrets.value.find(s => s.key === key)
  if (!secret) {
    return
  }

  const existingChange = pendingChanges.value.get(key)
  if (existingChange?.type === "create") {
    pendingChanges.value.delete(key)
  }
  else {
    const originalSecret = secrets.value.find(s => s.key === key)
    if (originalSecret) {
      pendingChanges.value.set(key, {
        type: "delete",
        secret: originalSecret,
        originalSecret,
      })
    }
  }
}

function handleSecretChange(secret: Secret) {
  const existingSecret = secrets.value.find(s => s.key === secret.key)
  const existingChange = pendingChanges.value.get(secret.key)
  if (!existingSecret) {
    pendingChanges.value.set(secret.key, { type: "create", secret })
  }
  else if (existingChange?.type === "create") {
    pendingChanges.value.set(secret.key, { type: "create", secret })
  }
  else {
    pendingChanges.value.set(secret.key, { type: "update", secret, originalSecret: existingSecret })
  }

  isSecretsDialogOpen.value = false
  selectedSecret.value = null
}

function handleImportSecrets(importedSecrets: any[]) {
  isEnvDialogOpen.value = false
  for (const importedSecret of importedSecrets) {
    const existingSecret = secrets.value.find(s => s.key === importedSecret.key)
    const pendingChange = pendingChanges.value.get(importedSecret.key)
    if (!existingSecret && !pendingChange) {
      pendingChanges.value.set(importedSecret.key, {
        type: "create",
        secret: importedSecret,
      })
    }
    else {
      const baseSecret = pendingChange?.secret || existingSecret!
      const mergedValues = [...(baseSecret.values || [])]
      for (const newValue of importedSecret.values || []) {
        const existingValueIndex = mergedValues.findIndex(v => v.environment === newValue.environment)
        if (existingValueIndex >= 0) {
          mergedValues[existingValueIndex] = newValue
        }
        else {
          mergedValues.push(newValue)
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
}

async function saveAllChanges() {
  if (!project.value?.id) {
    return
  }

  const projectId = project.value.id
  for (const [_key, change] of pendingChanges.value.entries()) {
    if (change.type === "create") {
      const { values, id, project, createdAt, updatedAt, ...secretData } = change.secret
      await projectStore.createProjectSecret(projectId, {
        key: secretData.key,
        description: secretData.description || "",
        projectId,
        values: (values || []).map(v => ({ environment: v.environment, value: v.value })),
      })
    }
    else if (change.type === "update" && change.secret.id) {
      const { values, ...secretData } = change.secret
      await projectStore.updateProjectSecret(projectId, change.secret.id, {
        description: secretData.description || "",
        values: values || [],
      })
    }
    else if (change.type === "delete" && change.secret.id) {
      await projectStore.deleteProjectSecret(projectId, change.secret.id)
    }
  }

  pendingChanges.value.clear()
  await projectStore.getProjectSecrets(projectId)
}

function discardAllChanges() {
  if (!confirm("Are you sure you want to discard all pending changes?")) {
    return
  }

  pendingChanges.value.clear()
}

onBeforeRouteLeave((_to, _from, next) => {
  if (hasPendingChanges.value) {
    const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?")
    next(confirmed)
  }
  else {
    next()
  }
})

watch(() => project.value?.id, async (id: string | undefined) => {
  if (!id) {
    return
  }

  await projectStore.getProjectSecrets(id)
  const projectTitle = projectStore.projects.find(p => p.id === id)?.name

  useHead({
    title: `${projectTitle}`,
    link: [{ rel: "canonical", href: `https://windkeep.vercel.app/${id}` }],
    meta: [{ name: "description", content: `${projectTitle} project page.` }],
  })
}, { immediate: true })

definePageMeta({
  layout: "admin",
  middleware: "auth",
})
</script>
