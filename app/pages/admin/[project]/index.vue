<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-2">
      <nuxt-link to="/admin/projects" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left-bold" size="25" class="hover:scale-sm text-muted-foreground hover:text-accent" />
      </nuxt-link>
      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>

      <nav class="navigation-group w-full flex-1 justify-end" aria-label="Project Actions">
        <button class="btn-primary" aria-label="Add New Secret" @click="() => { isDialogOpen = true; dialogType = 'secret'; selectedSecret = null }">
          <span class="hidden md:inline">Add New Secret</span>
          <icon name="ph:plus-bold" size="20" />
        </button>

        <button class="btn-secondary" aria-label="Import Secrets from .env File" @click="() => { isDialogOpen = true; dialogType = 'env'; selectedSecret = null }">
          <span class="hidden md:block">Import</span>
          <icon name="ph:upload-bold" size="20" />
        </button>

        <div ref="dropdownRef" class="relative">
          <button class="btn" aria-label="Export Secrets to .env File" @click="isDropdownOpen = !isDropdownOpen">
            <span class="hidden md:block">Export</span>
            <icon name="ph:download-bold" size="20" />
          </button>

          <transition name="dropdown" mode="out-in">
            <ul v-if="isDropdownOpen" class="dropdown scroll-area -left-8 overflow-y-auto text-sm" role="menu" aria-label="Export environments">
              <li
                v-for="env in ['development', 'staging', 'production']" :key="env"
                role="menuitem" class="hover:bg-muted rounded p-2 capitalize"
                @click="handleExport(env)"
              >
                {{ env }}
              </li>
            </ul>
          </transition>
        </div>

        <nuxt-link :to="`/admin/${project?.slug}/settings`" class="btn">
          <icon name="ph:gear-bold" size="20" />
        </nuxt-link>
      </nav>
    </header>

    <p v-if="!secrets.length" class="text-caption my-8 h-[80vh] text-center">
      No secrets found for this project. Add a new secret or import from an .env file to get started.
    </p>

    <ProjectSecretsTable
      v-if="secrets.length" :secrets="secrets"
      :project-id="project?.id" @edit="(secret: Secret) => { isDialogOpen = true; dialogType = 'secret'; selectedSecret = secret }"
    />

    <ProjectSecretDialog
      :is-open="isDialogOpen && dialogType === 'secret'" :selected-secret="selectedSecret"
      :project-id="project?.id ?? ''" @close="() => { isDialogOpen = false; dialogType = null; selectedSecret = null }"
      @save="handleSubmit"
    />

    <ProjectSecretImportDialog
      :is-open="isDialogOpen && dialogType === 'env'" :project-id="project?.id ?? ''"
      :secrets="secrets" @close="() => { isDialogOpen = false; dialogType = null; selectedSecret = null }"
      @save="handleImportFromEnv"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const { activeOrg } = useUserActions()
const { allProjects, projectSecrets, createSecret, updateSecret, fetchSecrets } = useProjectActions()

const project = computed(() => allProjects.value.find(p => p.slug === slug) || null)
const { handleImportFromEnv: importFromEnv, handleExportToEnv: exportToEnv } = useEnvFile(project.value?.id)
const secrets = projectSecrets

const selectedSecret = ref<Secret | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dialogType = ref<"secret" | "env" | null>(null)
const isDialogOpen = ref(false)
const isDropdownOpen = ref(false)

useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
}, { escapeKey: true })

async function handleImportFromEnv(importedSecrets: Secret[]) {
  const result = await importFromEnv(importedSecrets)

  if (result.failed > 0) {
    console.error("Import errors:", result.errors)
  }

  if (result.success > 0) {
    // Optionally show success toast notification here
    console.log(`Successfully imported ${result.success} secrets`)
  }
}

function handleExport(env: string) {
  const result = exportToEnv(env)

  if (!result.success) {
    console.error("Export error:", result.error)
    // Optionally show toast notification here
  }

  isDropdownOpen.value = false
}

async function handleSubmit(secret: any) {
  isDialogOpen.value = false
  dialogType.value = null
  selectedSecret.value = null

  if (!project.value?.id)
    return

  const success = secret.id
    ? await updateSecret(project.value.id, secret.id, {
        description: secret.description ?? "",
      })
    : await createSecret(project.value.id, {
        key: secret.key,
        description: secret.description ?? "",
        projectId: project.value.id,
      })

  if (success)
    await fetchSecrets(project.value.id)
}

watch([project, activeOrg], ([proj, org]) => {
  if (proj && org && proj.organizationId && proj.organizationId !== org.id) {
    navigateTo("/admin/projects")
  }
}, { immediate: false })

watch(() => project.value?.id, async (id: string | undefined) => {
  if (!id)
    return

  await fetchSecrets(id)
  const projectTitle = allProjects.value?.find(p => p.id === id)?.name

  useHead({
    title: `${projectTitle}`,
    link: [{ rel: "canonical", href: `https://secretkeepr.vercel.app/${id}` }],
    meta: [{ name: "description", content: `${projectTitle} project page.` }],
  })
}, { immediate: true })

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(0.25rem);
}
.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
