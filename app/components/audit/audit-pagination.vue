<template>
  <nav v-if="pagination && pagination.totalPages > 0" class="navigation-group w-full flex-1 justify-between" aria-label="Pagination">
    <button class="btn-secondary" :disabled="!pagination.hasPrev" title="Previous Page" @click="auditStore.prevPage(activeOrg!.id)">
      <icon name="ph:arrow-left" size="20" />
    </button>

    <div class="text-caption flex flex-col items-center justify-center gap-1 whitespace-nowrap md:mx-4">
      <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
      <span v-if="auditLogs.length" class="text-xs italic">{{ `Showing ${auditLogs.length} ${auditLogs.length === 1 ? "log" : "logs"}` }}</span>
    </div>

    <button class="btn-secondary" :disabled="!pagination.hasNext" title="Next Page" @click="auditStore.nextPage(activeOrg!.id)">
      <icon name="ph:arrow-right" size="20" />
    </button>
  </nav>
</template>

<script setup lang="ts">
const auditStore = useAuditStore()
const { auditLogs, pagination } = storeToRefs(auditStore)
const { activeOrg } = storeToRefs(useOrgStore())
</script>
