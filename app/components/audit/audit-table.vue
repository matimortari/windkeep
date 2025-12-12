<template>
  <div class="w-full overflow-x-auto">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <icon :name="col.icon" size="20" />
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-primary focus:outline-none" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="20" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="text-caption p-8 text-center">
            Loading audit logs...
          </td>
        </tr>

        <tr v-else-if="!auditLogs.length">
          <td :colspan="columns.length" class="text-caption p-8 text-center">
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus" :icon-size="30" />
          </td>
        </tr>

        <template v-for="log in sortedLogs" v-else :key="log.id">
          <tr class="cursor-pointer hover:bg-muted" @click="toggleRow(log.id)">
            <td>
              <icon name="ph:caret-right" size="15" class="hover:text-primary" :class="expandedRows.has(log.id) ? 'rotate-90' : 'rotate-0'" />
            </td>

            <td :title="actionLabel(log.action)">
              <div class="navigation-group max-w-xs truncate">
                <icon :name="resourceIcon(log.resource)" size="15" />
                <span class="text-caption">{{ actionLabel(log.action) }}</span>
              </div>
            </td>

            <td class="text-caption max-w-md truncate" :title="log.description || 'No description'">
              {{ log.description || 'No description' }}
            </td>

            <td class="text-caption max-w-sm truncate md:max-w-32" :title="log.user?.name || log.user?.email">
              {{ log.user?.name || log.user?.email }}
            </td>

            <td class="text-caption max-w-sm truncate md:max-w-40" :title="log.createdAt ? formatAuditDate(log.createdAt) : 'N/A'">
              {{ log.createdAt ? formatAuditDate(log.createdAt) : 'N/A' }}
            </td>
          </tr>

          <tr v-if="expandedRows.has(log.id)" class="cursor-pointer border text-sm hover:bg-muted" @click="toggleRow(log.id)">
            <td :colspan="columns.length" class="max-w-4xl">
              <Shiki v-if="log.metadata && Object.keys(log.metadata).length" lang="json" :code="JSON.stringify(log.metadata, null, 2)" class="code-block" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const auditStore = useAuditStore()
const { auditLogs, auditActions, loading } = storeToRefs(auditStore)
const expandedRows = ref<Set<string>>(new Set())

const { sortedData: sortedLogs, toggleSort, getSortIconName } = useTableSort(auditLogs)

const columns = [
  { key: "expand", label: "", icon: "ph:eye", class: "w-10", sortable: false },
  { key: "action", label: "Action", icon: "ph:lightning", class: "w-28", sortable: true },
  { key: "description", label: "Description", icon: "ph:text-align-left", sortable: false },
  { key: "user", label: "User", icon: "ph:user", class: "w-28", sortable: true },
  { key: "date", label: "Date", icon: "ph:calendar", class: "w-44", sortable: true },
]

const resourceMap: Record<string, string> = {
  organization: "ph:buildings",
  organization_invite: "ph:envelope",
  organization_member: "ph:users-three",
  project: "ph:folder",
  project_member: "ph:user-plus",
  secret: "ph:key",
}

function resourceIcon(resource: string | null | undefined) {
  return (resource && resourceMap[resource]) || "ph:cube"
}

function actionLabel(action: string) {
  const item = auditActions.value.find(a => a.value === action)
  return item?.label || action
}

function formatAuditDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date))
}

function toggleRow(id: string) {
  expandedRows.value.has(id) ? expandedRows.value.delete(id) : expandedRows.value.add(id)
}
</script>
