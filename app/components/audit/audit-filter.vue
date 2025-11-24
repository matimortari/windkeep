<template>
  <div class="flex flex-col items-start justify-between gap-2 pt-4 md:navigation-group">
    <nav class="navigation-group" aria-label="Filters">
      <input
        v-model="dateFilter" type="date"
        title="Filter by date" class="hidden md:block"
        @change="updateDateFilter"
      >

      <div ref="userDropdownRef" class="relative">
        <button class="btn" title="Filter by user" @click="isUserDropdownOpen = !isUserDropdownOpen">
          <span class="capitalize">{{ getUserDisplayName(currentFilters.userId) || 'All Users' }}</span>
          <icon name="ph:caret-down" size="15" />
        </button>
        <transition name="dropdown">
          <ul v-if="isUserDropdownOpen" class="dropdown-menu scroll-area overflow-y-auto text-sm whitespace-nowrap">
            <li class="rounded p-2 hover:bg-muted" @click="setUserFilter('')">
              All Users
            </li>
            <li v-for="user in availableUsers" :key="user.id" class="flex items-center gap-1 rounded p-2 hover:bg-muted" @click="setUserFilter(user.id)">
              <span>{{ user.name || user.email }}</span>
            </li>
          </ul>
        </transition>
      </div>

      <div ref="actionDropdownRef" class="relative">
        <button class="btn" title="Filter by action" @click="isActionDropdownOpen = !isActionDropdownOpen">
          <span>{{ getActions.find((a: { value: string; label: string }) => a.value === currentFilters.action)?.label || 'All Actions' }}</span>
          <icon name="ph:caret-down" size="15" />
        </button>
        <transition name="dropdown">
          <ul v-if="isActionDropdownOpen" class="dropdown-menu scroll-area -left-8 overflow-y-auto text-sm whitespace-nowrap">
            <li class="rounded p-2 hover:bg-muted" @click="setActionFilter('')">
              All Actions
            </li>
            <li v-for="action in getActions" :key="action.value" class="rounded p-2 hover:bg-muted" @click="setActionFilter(action.value)">
              {{ action.label }}
            </li>
          </ul>
        </transition>
      </div>

      <button class="btn" title="Show/Hide Sensitive Info" @click="showSensitiveInfo = !showSensitiveInfo">
        <icon :name="showSensitiveInfo ? 'ph:eye-slash' : 'ph:eye'" size="20" />
      </button>
    </nav>

    <nav v-if="pagination && pagination.totalPages > 0" class="navigation-group" aria-label="Pagination">
      <input
        v-model="dateFilter" type="date"
        title="Filter by date" class="md:hidden"
        @change="updateDateFilter"
      >

      <button class="btn-secondary" :disabled="!pagination.hasPrev" title="Previous Page" @click="prevPage()">
        <icon name="ph:arrow-left" size="20" />
      </button>
      <div class="text-caption flex flex-col items-center justify-center gap-1 whitespace-nowrap md:mx-4">
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <span v-if="auditLogs.length" class="text-xs italic">{{ logsSummary }}</span>
      </div>
      <button class="btn-secondary" :disabled="!pagination.hasNext" title="Next Page" @click="nextPage()">
        <icon name="ph:arrow-right" size="20" />
      </button>

      <button class="btn-danger" :disabled="!auditLogs.length" title="Delete Logs" @click="handleDeleteLogs">
        <icon name="ph:trash" size="20" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>()

const auditStore = useAuditStore()
const { auditLogs, pagination, filters, currentFilters, getActions } = storeToRefs(auditStore)
const { activeOrg } = storeToRefs(useOrgStore())
const dateFilter = ref("")
const isUserDropdownOpen = ref(false)
const isActionDropdownOpen = ref(false)
const userDropdownRef = ref<HTMLElement | null>(null)
const actionDropdownRef = ref<HTMLElement | null>(null)
const showSensitiveInfo = computed({
  get: () => props.modelValue ?? false,
  set: value => emit("update:modelValue", value),
})

const availableUsers = computed(() => {
  return filters.value?.users || []
})

useClickOutside(userDropdownRef, () => {
  isUserDropdownOpen.value = false
}, { escapeKey: true })

useClickOutside(actionDropdownRef, () => {
  isActionDropdownOpen.value = false
}, { escapeKey: true })

function getUserDisplayName(userId?: string) {
  if (!userId)
    return "All Users"

  const user = availableUsers.value.find((u: { id: string, name: string | null, email: string }) => u.id === userId)
  return user?.name || user?.email
}

function updateDateFilter() {
  const newFilters = { ...currentFilters.value, startDate: dateFilter.value }
  auditStore.updateFilters(newFilters)
}

function setUserFilter(userId: string) {
  auditStore.updateFilters({ ...currentFilters.value, userId })
  isUserDropdownOpen.value = false
}

function setActionFilter(action: string) {
  auditStore.updateFilters({ ...currentFilters.value, action })
  isActionDropdownOpen.value = false
}

function prevPage() {
  if (activeOrg.value)
    auditStore.prevPage(activeOrg.value.id)
}

function nextPage() {
  if (activeOrg.value)
    auditStore.nextPage(activeOrg.value.id)
}

const logsSummary = computed(() => {
  const count = auditLogs.value.length
  const label = count === 1 ? "log" : "logs"
  return count ? `${count} ${label}` : "no matching logs"
})

async function handleDeleteLogs() {
  if (!confirm(`Are you sure you want to delete ${logsSummary.value}? This action cannot be undone.`))
    return

  await auditStore.deleteAuditLogs(activeOrg.value!.id, {
    olderThan: dateFilter.value ? new Date(dateFilter.value).toISOString() : undefined,
    action: currentFilters.value.action,
    userId: currentFilters.value.userId,
  })

  auditStore.getAuditLogs(activeOrg.value!.id, currentFilters.value)
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
