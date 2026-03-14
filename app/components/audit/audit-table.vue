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
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus-bold" />
          </td>
        </tr>

        <template v-for="log in sortedLogs" v-else :key="log.id">
          <tr class="cursor-pointer hover:bg-muted/20" :aria-expanded="expandedRows.has(log.id)" @click="toggleRow(log.id)">
            <td>
              <icon name="ph:caret-right-bold" size="15" class="hover:text-primary" :class="expandedRows.has(log.id) ? 'rotate-90' : 'rotate-0'" />
            </td>
            <td>
              <div class="navigation-group max-w-xs truncate">
                <icon :name="resourceMap[log.resource || ''] || ''" size="15" />
                <span>{{ auditActions.find(a => a.value === log.action)?.label || log.action }}</span>
              </div>
            </td>
            <td class="max-w-md overflow-visible!">
              <span class="group/tooltip relative inline-flex max-w-full">
                <span class="truncate">{{ log.description || 'No description' }}</span>
                <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {{ log.description || 'No description' }}
                </span>
              </span>
            </td>
            <td class="max-w-sm overflow-visible! md:max-w-32">
              <span class="group/tooltip relative inline-flex max-w-full">
                <span class="truncate">{{ log.user?.name || log.user?.email }}</span>
                <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {{ log.user?.name || log.user?.email }}
                </span>
              </span>
            </td>
            <td class="max-w-sm overflow-visible! md:max-w-40">
              <span class="group/tooltip relative inline-flex max-w-full">
                <span class="truncate">{{ log.createdAt ? formatAuditDate(log.createdAt) : 'N/A' }}</span>
                <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {{ log.createdAt ? formatAuditDate(log.createdAt) : 'N/A' }}
                </span>
              </span>
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

              <div v-if="(log.metadata || {})" class="relative">
                <button class="btn absolute top-2 right-2 z-10" aria-label="Copy metadata" @click.stop="copyMetadataActions.get(log.id)?.triggerCopy(formatMetadata(log.metadata))">
                  <icon :name="copyMetadataActions.get(log.id)?.icon.value || 'ph:copy-bold'" size="15" />
                </button>
                <Shiki lang="json" :code="formatMetadata(log.metadata)" class="code-block" />
              </div>
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
const { createActionHandler } = useActionIcon()

const copyMetadataActions = computed(() => {
  const actions = new Map()
  auditLogs.value.forEach(log => actions.set(log.id, createActionHandler("ph:copy")))

  return actions
})

const columns = [
  { key: "expand", label: "", icon: "ph:eye-bold", class: "w-10", sortable: false },
  { key: "action", label: "Action", icon: "ph:lightning-bold", class: "w-28", sortable: true },
  { key: "description", label: "Description", icon: "ph:text-align-left-bold", sortable: false },
  { key: "user", label: "User", icon: "ph:user-bold", class: "w-28", sortable: true },
  { key: "createdAt", label: "Date", icon: "ph:calendar-bold", class: "w-44", sortable: true },
]

const resourceMap: Record<string, string> = {
  organization: "ph:buildings-bold",
  organization_invite: "ph:envelope-bold",
  organization_member: "ph:users-three-bold",
  project: "ph:folder-bold",
  project_member: "ph:user-plus-bold",
  secret: "ph:key-bold",
}

function toggleRow(id: string) {
  expandedRows.value.has(id) ? expandedRows.value.delete(id) : expandedRows.value.add(id)
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

  const keyOrder = [
    "secretId",
    "secretKey",
    "memberId",
    "memberName",
    "memberEmail",
    "memberRole",
    "inviteId",
    "userId",
    "userName",
    "userEmail",
    "projectId",
    "projectName",
    "orgId",
    "orgName",
    "orgDescription",
    "orgWebsite",
    "fromUserId",
    "fromUserName",
    "fromUserEmail",
    "toUserId",
    "toUserName",
    "toUserEmail",
    "oldName",
    "newName",
    "oldDescription",
    "newDescription",
    "oldWebsite",
    "newWebsite",
    "oldSlug",
    "oldRole",
    "newRole",
    "descriptionChanged",
    "nameChanged",
    "environmentCount",
    "environments",
    "secretsDeleted",
    "membersRemoved",
    "valuesDeleted",
    "expiresAt",
  ]

  const sortedMetadata: Record<string, any> = {}
  for (const key of keyOrder) {
    if (key in metadata) {
      sortedMetadata[key] = metadata[key]
    }
  }
  for (const key of Object.keys(metadata)) {
    if (!(key in sortedMetadata)) {
      sortedMetadata[key] = metadata[key]
    }
  }

  return JSON.stringify(sortedMetadata, null, 2)
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
