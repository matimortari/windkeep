<template>
  <TabSection title="Audit Logs">
    <template #context>
      <h3 class="flex max-w-lg flex-row items-center gap-1 truncate text-muted-foreground">
        <span class="truncate">{{ activeOrg?.name }}</span>
        <nuxt-link v-if="activeOrg?.website" :href="activeOrg.website" target="_blank" aria-label="Visit organization website">
          <icon name="ph:arrow-up-right-bold" size="15" class="hover:text-primary" />
        </nuxt-link>
      </h3>
    </template>

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
