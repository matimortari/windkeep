<template>
  <div class="scroll-area w-full overflow-x-auto p-4!">
    <table class="min-w-full table-auto rounded-t-lg border bg-card md:w-full md:overflow-hidden">
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
          <td :colspan="getTableHeaders().length" class="text-caption border p-8 text-center">
            <span>Loading audit logs...</span>
          </td>
        </tr>

        <tr v-else-if="!auditLogs.length">
          <td :colspan="getTableHeaders().length" class="text-caption border p-8 text-center">
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus-bold" :icon-size="30" />
          </td>
        </tr>

        <tr v-for="log in auditLogs" v-else :key="log.id" class="border text-sm hover:bg-muted">
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
