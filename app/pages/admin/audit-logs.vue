<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <header class="navigation-group border-b py-2">
      <h2>
        Audit Logs
      </h2>

      <AuditFilter />
    </header>

    <div class="flex max-h-screen flex-col gap-2">
      <AuditTable />
      <AuditPagination />
    </div>
  </div>
</template>

<script setup lang="ts">
const { activeOrg } = storeToRefs(useOrgStore())
const auditStore = useAuditStore()

watch(activeOrg, async (org) => {
  if (org?.id) {
    await auditStore.getAuditLogs(org.id)
  }
}, { immediate: true })

useHead({
  title: "Audit Logs",
  link: [{ rel: "canonical", href: "https://windkeep.vercel.app/admin/audit-logs" }],
  meta: [{ name: "description", content: "WindKeep audit logs page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
