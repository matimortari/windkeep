<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="800"
    class="container mx-auto"
  >
    <ProjectSecretsTab v-show="activeTab === 'secrets'" :project="project" :has-permission="hasPermission" />
    <ProjectAccessControlTab v-if="activeTab === 'access-control'" />
    <ProjectSettingsTab v-else-if="activeTab === 'settings'" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.project
const projectStore = useProjectStore()
const { activeOrg } = storeToRefs(useOrgStore())
const { isOwner, isAdmin } = storeToRefs(projectStore)
const project = computed(() => projectStore.projects.find(p => p.slug === slug))
const hasPermission = computed(() => isOwner.value(project.value?.id ?? "") || isAdmin.value(project.value?.id ?? ""))

const activeTab = computed(() => {
  const tab = route.query.t as string
  return ["secrets", "access-control", "settings"].includes(tab) ? tab : "secrets"
})

// Redirect when the project is missing or belongs to another organization
watch([project, activeOrg], ([currentProject, org]) => {
  if (!org?.id) {
    return
  }
  if (!currentProject || currentProject.orgId !== org.id) {
    navigateTo({ path: "/admin/organization", query: { t: "projects" } }, { replace: true })
  }
}, { immediate: true })

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
