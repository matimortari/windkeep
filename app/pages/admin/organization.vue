<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="1000"
    class="container mx-auto"
  >
    <OrganizationProjectsTab v-if="activeTab === 'projects'" />
    <OrganizationMembersTab v-else-if="activeTab === 'members'" />
    <OrganizationAuditLogsTab v-else-if="activeTab === 'audit-logs'" />
    <OrganizationSettingsTab v-else-if="activeTab === 'settings'" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()

const activeTab = computed(() => {
  const tab = route.query.t as string
  return ["projects", "members", "audit-logs", "settings"].includes(tab) ? tab : "projects"
})

useHead({
  title: "Organization",
  link: [{ rel: "canonical", href: `${baseURL}/admin/organization` }],
  meta: [{ name: "description", content: "WindKeep organization page." }],
})

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
