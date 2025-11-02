<template>
  <div class="scroll-area w-full overflow-x-auto">
    <table class="bg-card min-w-full table-auto rounded-t-lg border md:w-full md:overflow-hidden">
      <thead>
        <tr class="bg-muted text-sm font-semibold">
          <th v-for="header in tableHeaders" :key="header.value" class="border-x text-start">
            <div class="navigation-group truncate p-2">
              <icon :name="header.icon" size="20" />
              <span>{{ header.label }}</span>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="tableHeaders.length" class="border p-8 text-center">
            <div class="navigation-group">
              <icon name="material-symbols:hourglass-empty" size="20" class="animate-spin" />
              <span>Loading audit logs...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="auditLogs.length === 0">
          <td :colspan="tableHeaders.length" class="text-muted-foreground border p-8 text-center">
            <div class="navigation-group">
              <icon name="material-symbols:search-off" size="20" />
              <span>No audit logs found</span>
            </div>
          </td>
        </tr>

        <!-- Data rows -->
        <tr v-for="log in auditLogs" v-else :key="log.id" class="hover:bg-muted border text-sm">
          <td class="max-w-sm truncate border p-2 md:max-w-24" :title="actions.find(a => a.value === log.action)?.label">
            {{ actions.find(a => a.value === log.action)?.label }}
          </td>
          <td class="text-caption max-w-sm truncate border p-2 md:max-w-28" :title="log.resource">
            {{ log.resource }}
          </td>
          <td class="text-caption max-w-md truncate border p-2 md:max-w-60" :title="plainMetadata(log.metadata)">
            <span v-html="formatMetadata(log.metadata)" />
          </td>
          <td class="text-caption max-w-sm truncate border p-2 md:max-w-24" :title="log.user?.name || log.user?.email">
            {{ log.user?.name || log.user?.email }}
          </td>
          <td class="text-caption max-w-sm truncate border p-2 md:max-w-32" :title="formatDate(log.createdAt)">
            {{ formatDate(log.createdAt) }}
          </td>
          <!-- <td class="text-caption max-w-sm truncate border p-2 md:max-w-24" :title="showSensitiveInfo ? formatSensitiveData(log.metadata, 1000) : 'Hidden'">
            <span v-if="showSensitiveInfo" v-html="formatSensitiveData(log.metadata, 1000)" />
            <span v-else>Hidden</span>
          </td> -->
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// defineProps<{
//   showSensitiveInfo?: boolean
// }>()

// formatSensitiveData

const { auditLogs, loading, formatDate, formatMetadata, getTableHeaders, getActions } = useAudit()

const tableHeaders = getTableHeaders()
const actions = getActions

function plainMetadata(metadata: any) {
  const html = formatMetadata(metadata)
  return html.replace(/<[^>]*>?/g, "")
}
</script>
