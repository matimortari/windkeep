<template>
  <TabSection title="Audit Logs">
    <template #context>
      <h3 class="flex max-w-full min-w-0 items-center gap-1 text-muted-foreground">
        <span class="min-w-0 truncate">{{ activeOrg?.name }}</span>
        <nuxt-link
          v-if="activeOrg?.website" :href="activeOrg.website"
          target="_blank" class="shrink-0"
          aria-label="Visit organization website"
        >
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
