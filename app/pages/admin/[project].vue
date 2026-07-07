<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="800"
    class="container mx-auto"
  >
    <ProjectSecretsTab v-show="activeTab === 'secrets'" :project="project" :has-permission="hasPermission" />
    <ProjectMembersTab v-if="activeTab === 'members'" />
    <ProjectServiceTokensTab v-else-if="activeTab === 'service-tokens'" />
    <ProjectSettingsTab v-else-if="activeTab === 'settings'" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { isOwner, isAdmin } = storeToRefs(projectStore)
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const hasPermission = computed(() => isOwner.value(project.value?.id ?? "") || isAdmin.value(project.value?.id ?? ""))

const activeTab = computed(() => {
  const tab = route.query.t as string
  return ["secrets", "members", "service-tokens", "settings"].includes(tab) ? tab : "secrets"
})

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
