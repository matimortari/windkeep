<template>
  <TabSection context="Organization" title="Audit Logs">
    <template v-if="hasPermission" #actions>
      <AuditActions />
    </template>

    <Empty v-if="!hasPermission" message="You don't have permission to view audit logs for this organization." icon-name="ph:lock-bold" />

    <div v-else class="flex max-h-screen flex-col gap-2">
      <AuditTable />
      <AuditPagination />
    </div>
  </TabSection>
</template>

<script setup lang="ts">
const orgStore = useOrgStore()
const { activeOrg, isOwner, isAdmin, currentAuditFilters } = storeToRefs(orgStore)
const hasPermission = computed(() => isOwner.value || isAdmin.value)
const defaultFilters = { page: 1, limit: 25 }

onBeforeMount(() => currentAuditFilters.value = { ...defaultFilters })

// Get audit logs when organization changes and user has permission
watch(activeOrg, async (org) => {
  if (org?.id && hasPermission.value) {
    await orgStore.getAuditLogs(org.id, { ...defaultFilters })
  }
}, { immediate: true })
</script>
