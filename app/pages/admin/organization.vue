<template>
  <div
    v-motion :initial="{ opacity: 0 }"
    :enter="{ opacity: 1 }" :duration="800"
    class="container mx-auto"
  >
    <h2 class="border-b py-2">
      Organization
    </h2>

    <OrganizationProjectsTab v-if="uiState.adminTabs.organization === 'projects'" />
    <OrganizationMembersTab v-else-if="uiState.adminTabs.organization === 'members'" />
    <OrganizationAuditLogsTab v-else-if="uiState.adminTabs.organization === 'audit-logs'" />
    <OrganizationSettingsTab v-else-if="uiState.adminTabs.organization === 'settings'" />
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const { uiState } = useUIState()

useHead({
  title: "Organization",
  link: [{ rel: "canonical", href: `${baseURL}/admin/organization` }],
  meta: [{ name: "description", content: "WindKeep organization page." }],
})

definePageMeta({ layout: "admin", middleware: "auth" })
</script>
