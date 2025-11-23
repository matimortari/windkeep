<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-4">
      <nuxt-link to="/admin/projects" aria-label="Go back" class="flex items-center">
        <icon name="ph:arrow-left" size="30" class="text-muted-foreground hover:text-accent" />
      </nuxt-link>
      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>

      <nav class="navigation-group w-full flex-1 justify-end" aria-label="Project Actions">
        <button class="btn-primary" aria-label="Add New Secret" @click="() => { isDialogOpen = true; dialogType = 'secret'; selectedSecret = null }">
          <span class="hidden md:inline">Add New Secret</span>
          <icon name="ph:plus" size="20" />
        </button>

        <button class="btn-secondary" aria-label="Import Secrets from .env File" @click="() => { isDialogOpen = true; dialogType = 'env'; selectedSecret = null }">
          <span class="hidden md:block">Import</span>
          <icon name="ph:upload" size="20" />
        </button>

        <div ref="dropdownRef" class="relative">
          <button class="btn" aria-label="Export Secrets to .env File" @click="isDropdownOpen = !isDropdownOpen">
            <span class="hidden md:block">Export</span>
            <icon name="ph:download" size="20" />
          </button>

          <transition name="dropdown" mode="out-in">
            <ul v-if="isDropdownOpen" class="dropdown-menu scroll-area -left-8 overflow-y-auto text-sm" role="menu" aria-label="Export environments">
              <li v-for="env in environments" :key="env" class="rounded capitalize">
                <button role="menuitem" class="w-full p-2 text-left hover:bg-muted" @click="exportToEnv(env); isDropdownOpen = false">
                  {{ capitalizeFirst(env) }}
                </button>
              </li>
            </ul>
          </transition>
        </div>

        <nuxt-link :to="`/admin/${project?.slug}/settings`" class="btn">
          <icon name="ph:gear" size="20" />
        </nuxt-link>
      </nav>
    </header>

    <Empty v-if="!projectSecrets.length" message="Add a new secret or import from an .env file to get started." icon-name="ph:stack-minus" :icon-size="60" />

    <ProjectSecretsTable
      v-if="projectSecrets.length" :secrets="projectSecrets"
      :project-id="project?.id ?? ''" @edit="(secret: Secret) => { isDialogOpen = true; dialogType = 'secret'; selectedSecret = secret }"
    />

    <ProjectSecretsDialog
      :is-open="isDialogOpen && dialogType === 'secret'" :selected-secret="selectedSecret"
      :project-id="project?.id ?? ''" @close="() => { isDialogOpen = false; dialogType = null; selectedSecret = null }"
      @save="handleSubmit"
    />

    <ProjectSecretsImportDialog
      :is-open="isDialogOpen && dialogType === 'env'" :project-id="project?.id ?? ''"
      :secrets="projectSecrets" @close="() => { isDialogOpen = false; dialogType = null; selectedSecret = null }"
      @save="(secrets) => { importFromEnv(secrets); isDialogOpen = false }"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { activeOrg } = storeToRefs(useOrgStore())
const { importFromEnv, exportToEnv } = useEnvFile(projectStore.projects.find(p => p.slug === slug)?.id ?? "")

const environments: Environment[] = ["DEVELOPMENT", "STAGING", "PRODUCTION"]

const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const projectSecrets = computed(() => projectStore.secrets)
const selectedSecret = ref<Secret | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dialogType = ref<"secret" | "env" | null>(null)
const isDialogOpen = ref(false)
const isDropdownOpen = ref(false)

useClickOutside(dropdownRef, () => {
  isDropdownOpen.value = false
}, { escapeKey: true })

async function handleSubmit(secret: any) {
  isDialogOpen.value = false
  dialogType.value = null
  selectedSecret.value = null

  if (!project.value?.id)
    return

  const success = secret.id
    ? await projectStore.updateProjectSecret(project.value.id, secret.id, {
        description: secret.description ?? "",
      })
    : await projectStore.createProjectSecret(project.value.id, {
        key: secret.key,
        description: secret.description ?? "",
        projectId: project.value.id,
      })
  if (success)
    await projectStore.getProjectSecrets(project.value.id)
}

watch([project, projectStore.projects], ([proj, projects]) => {
  if (projects.length > 0 && !proj) {
    navigateTo("/admin/projects", { replace: true })
  }
}, { immediate: true })

watch([project, activeOrg], ([proj, org]) => {
  if (proj && org && proj.orgId && proj.orgId !== org.id) {
    navigateTo("/admin/projects")
  }
}, { immediate: false })

watch(() => project.value?.id, async (id: string | undefined) => {
  if (!id)
    return

  await projectStore.getProjectSecrets(id)
  const projectTitle = projectStore.projects.find(p => p.id === id)?.name

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
