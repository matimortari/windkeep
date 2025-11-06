<template>
  <div class="scroll-area w-full overflow-x-auto">
    <table class="bg-card min-w-full table-auto rounded-t-lg border md:w-full md:overflow-hidden">
      <thead>
        <tr class="bg-muted text-sm font-semibold">
          <th v-for="header in getTableHeaders()" :key="header.value" class="border-x text-start">
            <div class="navigation-group truncate p-2">
              <icon :name="header.icon" size="20" />
              <span>{{ header.label }}</span>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="getTableHeaders().length" class="border p-8 text-center">
            <div class="navigation-group">
              <icon name="material-symbols:hourglass-empty" size="20" class="animate-spin" />
              <span>Loading audit logs...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="auditLogs.length === 0">
          <td :colspan="getTableHeaders().length" class="text-muted-foreground border p-8 text-center">
            <div class="navigation-group">
              <icon name="material-symbols:search-off" size="20" />
              <span>No audit logs found</span>
            </div>
          </td>
        </tr>

        <tr v-for="log in auditLogs" v-else :key="log.id" class="hover:bg-muted border text-sm">
          <td class="border p-2" :title="getActionLabel(log.action)">
            <div class="navigation-group max-w-xs truncate">
              <icon :name="getResourceIcon(log.resource ?? null)" size="16" />
              <span class="text-caption">{{ getActionLabel(log.action) }}</span>
            </div>
          </td>

          <td class="text-caption max-w-md truncate border p-2 md:max-w-96" :title="log.description || 'No description'">
            {{ log.description || 'No description' }}
          </td>
          <td class="text-caption max-w-sm truncate border p-2 md:max-w-32" :title="log.user?.name || log.user?.email">
            {{ log.user?.name || log.user?.email }}
          </td>
          <td class="text-caption max-w-sm truncate border p-2 md:max-w-40" :title="log.createdAt ? formatDate(log.createdAt) : 'N/A'">
            {{ log.createdAt ? formatDate(log.createdAt) : 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const { auditLogs, loading, formatDate, getTableHeaders, getActionLabel, getResourceIcon } = useAuditActions()
</script>
