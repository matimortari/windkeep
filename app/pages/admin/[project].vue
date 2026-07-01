<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="800"
    class="container mx-auto"
  >
    <header class="navigation-group border-b py-2">
      <h2 class="max-w-lg truncate">
        {{ project?.name }}
      </h2>
      <nuxt-link v-if="project?.website" :href="project?.website" target="_blank" aria-label="Visit project website">
        <icon name="ph:arrow-up-right-bold" size="20" class="text-muted-foreground hover:text-primary" />
      </nuxt-link>
    </header>

    <ProjectSecretsTab v-show="uiState.adminTabs.project === 'secrets'" :project="project" :has-permission="hasPermission" />
    <ProjectMembersTab v-if="uiState.adminTabs.project === 'members'" />
    <ProjectServiceTokensTab v-else-if="uiState.adminTabs.project === 'service-tokens'" />
    <ProjectSettingsTab v-else-if="uiState.adminTabs.project === 'settings'" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { isOwner, isAdmin } = storeToRefs(projectStore)
const { uiState } = useUIState()
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const hasPermission = computed(() => isOwner.value(project.value?.id ?? "") || isAdmin.value(project.value?.id ?? ""))

// Set page metadata when project changes
watch(() => project.value?.id, (id) => {
  if (!id) {
    return
  }

  useHead({
    title: `${project.value?.name}`,
    link: [{ rel: "canonical", href: `${baseURL}/${id}` }],
    meta: [{ name: "description", content: `${project.value?.name} project page.` }],
  })
}, { immediate: true })

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
