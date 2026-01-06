<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <icon :name="col.icon" size="20" />
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-primary focus:outline-none" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="15" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="p-8 text-center">
            Loading audit logs...
          </td>
        </tr>

        <tr v-else-if="!auditLogs.length">
          <td :colspan="columns.length" class="p-8 text-center">
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus" />
          </td>
        </tr>

        <template v-for="log in sortedLogs" v-else :key="log.id">
          <tr class="cursor-pointer hover:bg-muted/20" @click="toggleRow(log.id)">
            <td>
              <icon name="ph:caret-right" size="15" class="hover:text-primary" :class="expandedRows.has(log.id) ? 'rotate-90' : 'rotate-0'" />
            </td>

            <td :title="actionLabel(log.action)">
              <div class="navigation-group max-w-xs truncate">
                <icon :name="resourceIcon(log.resource) || ''" size="15" />
                <span>{{ actionLabel(log.action) }}</span>
              </div>
            </td>
            <td class="max-w-md truncate" :title="log.description || 'No description'">
              {{ log.description || 'No description' }}
            </td>
            <td class="max-w-sm truncate md:max-w-32" :title="log.user?.name || log.user?.email">
              {{ log.user?.name || log.user?.email }}
            </td>
            <td class="max-w-sm truncate md:max-w-40" :title="log.createdAt ? formatAuditDate(log.createdAt) : 'N/A'">
              {{ log.createdAt ? formatAuditDate(log.createdAt) : 'N/A' }}
            </td>
          </tr>

          <tr v-if="expandedRows.has(log.id)" class="metadata-container cursor-pointer text-sm hover:bg-muted/20" @click="toggleRow(log.id)">
            <td :colspan="columns.length" class="max-w-4xl space-y-2">
              <div class="metadata-content flex flex-col items-start text-sm font-medium">
                <div class="text-caption navigation-group">
                  <span class="font-medium whitespace-nowrap">• User Agent:</span>
                  <span class="truncate">{{ log.ua || "unknown" }}</span>
                </div>
                <div class="text-caption navigation-group">
                  <span class="font-medium whitespace-nowrap">•   IP:</span>
                  <span class="truncate">{{ log.ip || "unknown" }}</span>
                </div>
              </div>

              <Shiki v-if="(log.metadata || {})" lang="json" :code="formatMetadata(log.metadata)" class="code-block" />
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
  { key: "createdAt", label: "Date", icon: "ph:calendar", class: "w-44", sortable: true },
]

const resourceMap: Record<string, string> = {
  organization: "ph:buildings",
  organization_invite: "ph:envelope",
  organization_member: "ph:users-three",
  project: "ph:folder",
  project_member: "ph:user-plus",
  secret: "ph:key",
}

function toggleRow(id: string) {
  expandedRows.value.has(id) ? expandedRows.value.delete(id) : expandedRows.value.add(id)
}

function resourceIcon(resource: string | null | undefined): string {
  return (resource && resourceMap[resource]) || ""
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

function formatMetadata(metadata: Record<string, any> | null | undefined): string {
  if (!metadata) {
    return "{}"
  }

  // Custom stringify that preserves key insertion order
  const indent = " ".repeat(2)
  function stringify(value: any, depth: number = 0): string {
    const currentIndent = indent.repeat(depth)
    const nextIndent = indent.repeat(depth + 1)

    if (value === null) {
      return "null"
    }
    if (value === undefined) {
      return "undefined"
    }
    if (typeof value === "string") {
      return `"${value}"`
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value)
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "[]"
      }
      const items = value.map(item => `${nextIndent}${stringify(item, depth + 1)}`).join(",\n")
      return `[\n${items}\n${currentIndent}]`
    }
    if (typeof value === "object") {
      const keys = Object.keys(value)
      if (keys.length === 0) {
        return "{}"
      }

      const items = keys.map(key => `${nextIndent}"${key}": ${stringify(value[key], depth + 1)}`).join(",\n")
      return `{\n${items}\n${currentIndent}}`
    }

    return String(value)
  }

  return stringify(metadata)
}
</script>

<style scoped>
.metadata-container {
  animation: slideDown 0.2s ease-out;
}
.metadata-content {
  animation: fadeIn 0.25s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
