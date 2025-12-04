<template>
  <div v-motion :initial="{ opacity: 0 }" :enter="{ opacity: 1 }" :duration="800">
    <h2 class="border-b py-4">
      Audit Logs
    </h2>

    <AuditFilter />

    <p v-if="loading" class="text-caption my-8 h-[80vh] text-center">
      Loading audit logs...
    </p>

    <div v-else class="scroll-area max-h-[80vh] overflow-y-auto">
      <AuditTable />
    </div>
  </div>
</template>

<script setup lang="ts">
const { activeOrg } = storeToRefs(useOrgStore())
const auditStore = useAuditStore()
const { loading } = storeToRefs(auditStore)

watch(activeOrg, async (org) => {
  if (org?.id) {
    await auditStore.getAuditLogs(org.id)
  }
}, { immediate: true })

useHead({
  title: "Audit Logs",
  link: [{ rel: "canonical", href: "https://secretkeepr.vercel.app/admin/audit-logs" }],
  meta: [{ name: "description", content: "SecretkeepR audit logs page." }],
})

definePageMeta({
  layout: "admin",
  middleware: auth,
})
</script>
