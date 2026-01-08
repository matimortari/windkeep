<template>
  <nav class="navigation-group w-full flex-1 justify-end" aria-label="Audit Filters">
    <nav class="navigation-group" aria-label="Filters">
      <input v-model="dateFilter" type="date" title="Filter by date" @change="updateFilter('date', dateFilter)">

      <div ref="userDropdownRef" class="relative">
        <button class="btn" title="Filter by user" @click="isUserDropdownOpen = !isUserDropdownOpen">
          <span>{{ getUserDisplayName(currentFilters.userId) || 'All Users' }}</span>
          <icon name="ph:caret-down" size="15" />
        </button>

        <transition name="dropdown">
          <ul v-if="isUserDropdownOpen" class="dropdown-menu overflow-y-auto text-sm whitespace-nowrap">
            <li class="rounded p-2 hover:bg-muted" @click="updateFilter('user', '')">
              All Users
            </li>
            <li v-for="user in availableUsers" :key="user.id" class="flex items-center gap-1 rounded p-2 hover:bg-muted" @click="updateFilter('user', user.id)">
              <span>{{ user.name }}</span>
            </li>
          </ul>
        </transition>
      </div>

      <div ref="actionDropdownRef" class="relative">
        <button class="btn" title="Filter by action" @click="isActionDropdownOpen = !isActionDropdownOpen">
          <span>{{ auditActions?.find((a: { value: string; label: string }) => a.value === currentFilters.action)?.label || 'All Actions' }}</span>
          <icon name="ph:caret-down" size="15" />
        </button>

        <transition name="dropdown">
          <ul v-if="isActionDropdownOpen" class="dropdown-menu -left-28! overflow-y-auto text-sm whitespace-nowrap">
            <li class="rounded p-2 hover:bg-muted" @click="updateFilter('action', '')">
              All Actions
            </li>
            <li v-for="action in auditActions" :key="action.value" class="rounded p-2 hover:bg-muted" @click="updateFilter('action', action.value)">
              {{ action.label }}
            </li>
          </ul>
        </transition>
      </div>

      <button class="btn-danger" :disabled="!auditLogs.length" title="Delete Logs" @click="handleDeleteLogs">
        <icon name="ph:trash" size="20" />
      </button>
    </nav>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean
}>()

const auditStore = useAuditStore()
const { auditLogs, auditActions, filters, currentFilters } = storeToRefs(auditStore)
const { activeOrg } = storeToRefs(useOrgStore())
const dateFilter = ref("")
const isUserDropdownOpen = ref(false)
const isActionDropdownOpen = ref(false)
const userDropdownRef = ref<HTMLElement | null>(null)
const actionDropdownRef = ref<HTMLElement | null>(null)
const availableUsers = computed(() => filters.value?.users || [])

useClickOutside(userDropdownRef, () => {
  isUserDropdownOpen.value = false
}, { escapeKey: true })

useClickOutside(actionDropdownRef, () => {
  isActionDropdownOpen.value = false
}, { escapeKey: true })

function getUserDisplayName(userId?: string) {
  if (!userId) {
    return "All Users"
  }

  const user = availableUsers.value.find((u: { id: string, name: string | null }) => u.id === userId)
  return user?.name
}

function updateFilter(type: "date" | "user" | "action", value: string) {
  const updated = { ...currentFilters.value, page: 1 }

  if (type === "date") {
    updated.startDate = value ? new Date(value).toISOString() : undefined
  }
  else if (type === "user") {
    updated.userId = value || undefined
    isUserDropdownOpen.value = false
  }
  else if (type === "action") {
    updated.action = value || undefined
    isActionDropdownOpen.value = false
  }

  auditStore.updateFilters(updated)
  auditStore.getAuditLogs(activeOrg.value!.id, updated)
}

async function handleDeleteLogs() {
  const hasFilters = dateFilter.value || currentFilters.value.action || currentFilters.value.userId
  const filterDesc = hasFilters ? "matching the current filters" : "in this organization"
  if (!confirm(`Are you sure you want to delete all audit logs ${filterDesc}? This action cannot be undone.`)) {
    return
  }

  await auditStore.deleteAuditLogs(activeOrg.value!.id, {
    olderThan: dateFilter.value ? new Date(dateFilter.value).toISOString() : undefined,
    action: currentFilters.value.action || undefined,
    userId: currentFilters.value.userId || undefined,
  })

  const resetFilters = { ...currentFilters.value, page: 1 }
  auditStore.updateFilters(resetFilters)
  await auditStore.getAuditLogs(activeOrg.value!.id, resetFilters)
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(0.25rem);
}
.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
input[type="date"] {
  padding: 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  color: var(--muted-foreground);
  color-scheme: dark;
}
input[type="date"]::-webkit-inner-spin-button,
input[type="date"]::-webkit-clear-button {
  display: none;
}
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}
</style>
