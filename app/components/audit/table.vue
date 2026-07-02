<template>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="col.class">
            <div class="navigation-group">
              <icon v-if="col.icon" :name="col.icon" size="15" aria-label="Expand rows" />
              <span>{{ col.label }}</span>
              <button v-if="col.sortable" class="flex items-center hover:text-secondary focus:outline-none" :aria-label="`Sort by ${col.label}`" @click="toggleSort(col.key)">
                <icon :name="getSortIconName(col.key)" size="15" class="transition-transform" />
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="!loading && !auditLogs.length">
          <td :colspan="columns.length" class="p-8 text-center">
            <Empty message="No audit logs found." icon-name="ph:magnifying-glass-minus-bold" />
          </td>
        </tr>

        <template v-for="log in sortedLogs" v-else :key="log.id">
          <tr class="cursor-pointer hover:bg-muted/20" :aria-expanded="expandedRows.has(log.id)" @click="toggleRow(log.id)">
            <td :class="columns[0]?.class">
              <icon name="ph:caret-right-bold" size="15" class="hover:text-secondary" :class="expandedRows.has(log.id) ? 'rotate-90' : 'rotate-0'" />
            </td>
            <td :class="columns[1]?.class">
              <div class="navigation-group max-w-xs truncate">
                <icon :name="resourceMap[log.resource || ''] || ''" size="15" />
                <span>{{ auditActions.find(a => a.value === log.action)?.label || log.action }}</span>
              </div>
            </td>
            <td class="max-w-md overflow-visible!" :class="columns[2]?.class">
              <span class="group/tooltip relative inline-flex max-w-full">
                <span class="truncate">{{ log.description || 'No description' }}</span>
                <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {{ log.description || 'No description' }}
                </span>
              </span>
            </td>
            <td class="max-w-sm overflow-visible!" :class="columns[3]?.class">
              <span class="group/tooltip relative inline-flex max-w-full">
                <span class="truncate">{{ log.user?.name || log.user?.email }}</span>
                <span class="card pointer-events-none absolute bottom-full left-0 z-50 w-max p-1! text-xs! opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                  {{ log.user?.name || log.user?.email }}
                </span>
              </span>
            </td>
            <td class="max-w-sm overflow-visible!" :class="columns[4]?.class">
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
                  <icon :name="copyMetadataActions.get(log.id)?.icon.value || 'ph:copy-bold'" size="20" />
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
const orgStore = useOrgStore()
const { auditLogs, auditActions, loading } = storeToRefs(orgStore)
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
  { key: "action", label: "Action", class: "w-28", sortable: true },
  { key: "description", label: "Description", sortable: false },
  { key: "user", label: "User", class: "w-28", sortable: true },
  { key: "createdAt", label: "Date", class: "w-44", sortable: true },
]

const resourceMap: Record<string, string> = {
  organization: "ph:buildings-bold",
  org_invite: "ph:envelope-bold",
  org_member: "ph:users-three-bold",
  project: "ph:folder-bold",
  project_member: "ph:user-plus-bold",
  service_token: "ph:terminal-bold",
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

function formatMetadata(metadata: Record<string, any> | string | null | undefined): string {
  if (!metadata) {
    return "{}"
  }

  const METADATA_KEY_ORDER = [
    "secretId",
    "secretKey",
    "memberId",
    "memberName",
    "memberEmail",
    "memberRole",
    "inviteId",
    "inviteeEmail",
    "inviteeRole",
    "userId",
    "userName",
    "userEmail",
    "projectId",
    "projectName",
    "orgId",
    "orgName",
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
    "environments",
    "secretsDeleted",
    "membersRemoved",
    "valuesDeleted",
    "expiresAt",
  ]

  const parsed: Record<string, any> = typeof metadata === "string" ? JSON.parse(metadata) : metadata
  if (typeof parsed !== "object" || parsed === null) {
    return "{}"
  }

  return JSON.stringify(Object.fromEntries(METADATA_KEY_ORDER.map(key => [key, parsed[key]]).filter(([key]) => key in parsed)), null, 2)
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
