<template>
  <div class="w-full overflow-x-auto">
    <table class="min-w-full table-auto rounded-t-lg border bg-card md:w-full md:overflow-hidden">
      <thead>
        <tr>
          <th class="header-cell w-12">
            <icon name="ph:eye" size="20" />
          </th>
          <th v-for="header in auditStore.getTableHeaders()" :key="header.value" class="header-cell">
            <div class="navigation-group truncate">
              <icon :name="header.icon" size="20" />
              <span>{{ header.label }}</span>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="auditStore.getTableHeaders().length + 1" class="text-caption border p-8 text-center">
            <span>Loading audit logs...</span>
          </td>
        </tr>

        <tr v-else-if="!auditLogs.length">
          <td :colspan="auditStore.getTableHeaders().length + 1" class="text-caption border p-8 text-center">
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus" :icon-size="30" />
          </td>
        </tr>

        <template v-for="log in auditLogs" v-else :key="log.id">
          <tr class="cursor-pointer border text-sm hover:bg-muted" @click="toggleRow(log.id)">
            <td class="border p-2 text-center">
              <icon name="ph:caret-right" size="15" :class="expandedRows.has(log.id) ? 'rotate-90' : 'rotate-0'" class="transition-transform" />
            </td>

            <td class="border p-2" :title="auditStore.getActionLabel(log.action)">
              <div class="navigation-group max-w-xs truncate">
                <icon :name="auditStore.getResourceIcon(log.resource ?? null)" size="15" />
                <span class="text-caption">{{ auditStore.getActionLabel(log.action) }}</span>
              </div>
            </td>

            <td class="text-caption max-w-md truncate border p-2" :title="log.description || 'No description'">
              {{ log.description || 'No description' }}
            </td>
            <td class="text-caption max-w-sm truncate border p-2 md:max-w-32" :title="log.user?.name || log.user?.email">
              {{ log.user?.name || log.user?.email }}
            </td>
            <td class="text-caption max-w-sm truncate border p-2 md:max-w-40" :title="log.createdAt ? auditStore.formatDate(log.createdAt) : 'N/A'">
              {{ log.createdAt ? auditStore.formatDate(log.createdAt) : 'N/A' }}
            </td>
          </tr>

          <tr v-if="expandedRows.has(log.id)" class="border-b bg-muted/50">
            <td :colspan="auditStore.getTableHeaders().length + 1" class="max-w-4xl border p-2">
              <Shiki v-if="log.metadata && Object.keys(log.metadata).length > 0" lang="json" :code="JSON.stringify(log.metadata, null, 2)" class="code-block" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const auditStore = useAuditStore()
const { auditLogs, loading } = storeToRefs(auditStore)
const expandedRows = ref<Set<string>>(new Set())

function toggleRow(logId: string) {
  if (expandedRows.value.has(logId)) {
    expandedRows.value.delete(logId)
  }
  else {
    expandedRows.value.add(logId)
  }
}
</script>
