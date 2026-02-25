<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="flex flex-col items-start gap-4 border-b py-2 whitespace-nowrap md:flex-row md:items-center md:justify-between">
      <h2 class="">
        Audit Logs
      </h2>

      <AuditActions v-if="hasPermission" />
    </header>

    <Empty v-if="!hasPermission" message="You don't have permission to view audit logs for this organization." icon-name="ph:lock-bold" />

    <div v-else class="flex max-h-screen flex-col gap-2">
      <AuditTable />
      <AuditPagination />
    </div>
  </div>
</template>

<script setup lang="ts">
const orgStore = useOrgStore()
const { activeOrg, isOwner, isAdmin } = storeToRefs(orgStore)
const auditStore = useAuditStore()
const hasPermission = computed(() => isOwner.value || isAdmin.value)

// Get audit logs when organization changes and user has permission
watch(activeOrg, async (org) => {
  if (org?.id && hasPermission.value) {
    await auditStore.getAuditLogs(org.id)
  }
}, { immediate: true })

useHead({
  title: "Audit Logs",
  link: [{ rel: "canonical", href: `${BASE_URL}/admin/audit-logs` }],
  meta: [{ name: "description", content: "WindKeep audit logs page." }],
})

definePageMeta({
  layout: "admin",
  middleware: "auth",
})
</script>
