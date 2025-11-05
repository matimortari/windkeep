<template>
  <div class="md:navigation-group flex flex-col items-start justify-between gap-2 border-b p-2">
    <nav class="navigation-group" aria-label="Filters">
      <input
        v-model="dateFilter"
        type="date"
        title="Filter by date"
        class="hidden md:block"
        @change="updateDateFilter"
      >

      <div ref="userDropdownRef" class="relative">
        <button class="btn" title="Filter by user" @click="isUserDropdownOpen = !isUserDropdownOpen">
          <span class="capitalize">{{ getUserDisplayName(currentFilters.userId) || 'All Users' }}</span>
          <icon name="ph:caret-down-bold" size="15" />
        </button>
        <transition name="dropdown">
          <ul v-if="isUserDropdownOpen" class="dropdown scroll-area overflow-y-auto text-sm whitespace-nowrap">
            <li class="hover:bg-muted rounded p-2" @click="setUserFilter('')">
              All Users
            </li>
            <li v-for="user in availableUsers" :key="user.id" class="hover:bg-muted flex items-center gap-1 rounded p-2" @click="setUserFilter(user.id)">
              <span>{{ user.name || user.email }}</span>
            </li>
          </ul>
        </transition>
      </div>

      <div ref="actionDropdownRef" class="relative">
        <button class="btn" title="Filter by action" @click="isActionDropdownOpen = !isActionDropdownOpen">
          <span>{{ getActions.find((a: { value: string; label: string }) => a.value === currentFilters.action)?.label || 'All Actions' }}</span>
          <icon name="ph:caret-down-bold" size="15" />
        </button>
        <transition name="dropdown">
          <ul v-if="isActionDropdownOpen" class="dropdown scroll-area -left-8 overflow-y-auto text-sm whitespace-nowrap">
            <li class="hover:bg-muted rounded p-2" @click="setActionFilter('')">
              All Actions
            </li>
            <li v-for="action in getActions" :key="action.value" class="hover:bg-muted rounded p-2" @click="setActionFilter(action.value)">
              {{ action.label }}
            </li>
          </ul>
        </transition>
      </div>

      <button class="btn" title="Show/Hide Sensitive Info" @click="showSensitiveInfo = !showSensitiveInfo">
        <icon :name="showSensitiveInfo ? 'ph:eye-slash-bold' : 'ph:eye-bold'" size="20" />
      </button>
    </nav>

    <nav v-if="pagination && pagination.totalPages > 0" class="navigation-group" aria-label="Pagination">
      <input
        v-model="dateFilter"
        type="date"
        class="md:hidden"
        title="Filter by date"
        @change="updateDateFilter"
      >

      <button class="btn-secondary" :disabled="!pagination.hasPrev" title="Previous Page" @click="handlePrevPage">
        <icon name="ph:arrow-left-bold" size="20" />
      </button>
      <div class="text-caption flex flex-col items-center justify-center gap-1 whitespace-nowrap md:mx-4">
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <span v-if="auditLogs.length" class="text-xs italic">{{ logsSummary }}</span>
      </div>
      <button class="btn-secondary" :disabled="!pagination.hasNext" title="Next Page" @click="handleNextPage">
        <icon name="ph:arrow-right-bold" size="20" />
      </button>

      <button class="btn-danger" :disabled="!auditLogs.length" title="Delete Logs" @click="handleDeleteLogs">
        <icon name="ph:trash-bold" size="20" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
}>()

const { auditLogs, pagination, filters, currentFilters, getActions, applyFilters, nextPage, prevPage, deleteLogs } = useAuditActions()
const { activeOrg } = useUserActions()

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

useClickOutside(userDropdownRef, () => isUserDropdownOpen.value = false, { escapeKey: true })
useClickOutside(actionDropdownRef, () => isActionDropdownOpen.value = false, { escapeKey: true })

function getUserDisplayName(userId?: string) {
  if (!userId)
    return "All Users"

  const user = availableUsers.value.find((u: { id: string, name: string | null, email: string }) => u.id === userId)
  return user?.name || user?.email
}

async function updateDateFilter() {
  if (!activeOrg.value?.id)
    return

  const newFilters = { ...currentFilters.value, startDate: dateFilter.value ? new Date(dateFilter.value).toISOString() : undefined }
  await applyFilters(activeOrg.value.id, newFilters)
}

async function setUserFilter(userId: string) {
  if (!activeOrg.value?.id)
    return

  const newFilters = { ...currentFilters.value, userId: userId || undefined }
  await applyFilters(activeOrg.value.id, newFilters)
  isUserDropdownOpen.value = false
}

async function setActionFilter(action: string) {
  if (!activeOrg.value?.id)
    return

  const newFilters = { ...currentFilters.value, action: action || undefined }
  await applyFilters(activeOrg.value.id, newFilters)
  isActionDropdownOpen.value = false
}

async function handlePrevPage() {
  if (!activeOrg.value?.id || !pagination.value?.hasPrev)
    return
  await prevPage(activeOrg.value.id)
}

async function handleNextPage() {
  if (!activeOrg.value?.id || !pagination.value?.hasNext)
    return
  await nextPage(activeOrg.value.id)
}

const logsSummary = computed(() => {
  const count = auditLogs.value.length
  return count ? `${count} ${count === 1 ? "log" : "logs"}` : "no matching logs"
})

async function handleDeleteLogs() {
  if (!activeOrg.value?.id)
    return
  if (!confirm(`Are you sure you want to delete ${logsSummary.value}? This action cannot be undone.`))
    return

  const deleteParams = {
    olderThan: dateFilter.value ? new Date(dateFilter.value).toISOString() : undefined,
    action: currentFilters.value.action,
    userId: currentFilters.value.userId,
  }

  await deleteLogs(activeOrg.value.id, deleteParams)
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
