<template>
  <nav v-if="auditPagination && auditPagination.totalPages > 0" class="navigation-group w-full flex-1 justify-between" aria-label="auditPagination">
    <button class="btn-info" :disabled="!auditPagination.hasPrev" aria-label="Previous Page" @click="orgStore.prevPage(activeOrg!.id)">
      <icon name="ph:arrow-left-bold" size="20" />
    </button>

    <div class="text-caption flex flex-col items-center justify-center gap-1 whitespace-nowrap md:mx-4">
      <span>{{ auditPagination.page }} / {{ auditPagination.totalPages }}</span>
      <span v-if="auditPagination.totalItems" class="text-xs italic">{{ summary }}</span>
    </div>

    <button class="btn-info" :disabled="!auditPagination.hasNext" aria-label="Next Page" @click="orgStore.nextPage(activeOrg!.id)">
      <icon name="ph:arrow-right-bold" size="20" />
    </button>
  </nav>
</template>

<script setup lang="ts">
const orgStore = useOrgStore()
const { activeOrg, auditPagination } = storeToRefs(orgStore)

const summary = computed(() => {
  const { page, limit, totalItems } = auditPagination.value!
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, totalItems)
  const label = totalItems === 1 ? "log" : "logs"
  return `Showing ${start}–${end} of ${totalItems} ${label}`
})
</script>
