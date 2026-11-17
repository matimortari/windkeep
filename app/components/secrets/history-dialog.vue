<template>
  <Dialog :is-open="isHistoryEditorOpen" title="Secret History" @update:is-open="closeDialog('history')">
    <p v-if="secretsStore.loading" class="text-caption">
      Loading history...
    </p>

    <template v-else>
      <div class="flex flex-col gap-2">
        <div class="navigation-group justify-between gap-1">
          <div class="flex min-w-0 flex-1 flex-row overflow-x-auto">
            <button
              v-for="env in ENVIRONMENTS" :key="env.value"
              type="button" class="history-tab"
              :class="activeEnv === env.value ? 'history-tab--active' : ''" :disabled="!historyByEnv.has(env.value)"
              @click="activeEnv = env.value"
            >
              {{ env.label }}
            </button>
          </div>

          <button
            type="button" class="btn-ghost shrink-0"
            :disabled="!activeHistory" :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'"
            @click="allVisible = !allVisible"
          >
            <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="15" />
            <span class="hidden md:inline">{{ allVisible ? 'Hide all' : 'Reveal all' }}</span>
          </button>
        </div>

        <Empty v-if="!activeHistory" message="No history available for this environment." icon-name="ph:clock-counter-clockwise-bold" />

        <div v-else class="card scroll-area max-h-[70vh] space-y-2 overflow-y-auto p-2">
          <div v-for="row in activeHistory.rows" :key="row.id" class="space-y-1 rounded-lg p-2">
            <div v-if="!row.isCurrent" class="flex items-center justify-between text-muted-foreground">
              <div class="navigation-group">
                <img :src="row.changedBy?.image || ''" :alt="row.changedBy?.name || 'Unknown'" class="size-4 rounded-full border">
                <span class="text-xs font-medium">{{ row.changedBy?.name || 'Unknown' }}</span>
              </div>
              <span class="text-xs">{{ formatChangedAt(row.changedAt!) }}</span>
            </div>

            <div class="navigation-group justify-between text-sm">
              <p class="flex flex-row items-center gap-1">
                <span class="truncate font-mono text-muted-foreground select-none" :aria-label="visibleMap[row.id] || allVisible ? undefined : 'Hidden value'">
                  {{ visibleMap[row.id] || allVisible ? row.value : "•".repeat(Math.min(Math.max(row.value?.length || 0, 6), 32)) }}
                </span>
                <span v-if="row.isCurrent" class="shrink-0 rounded-full bg-info/10 px-1.5 py-0.5 text-xs font-medium text-info">Current Value</span>
              </p>

              <div class="navigation-group text-muted-foreground">
                <button type="button" :aria-label="`Toggle visibility for ${row.id}`" @click="visibleMap[row.id] = !visibleMap[row.id]">
                  <icon :name="visibleMap[row.id] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
                </button>
                <button type="button" :aria-label="`Copy value for ${row.id}`" @click="handleCopy(row.id, row.value)">
                  <icon :name="copyStates[row.id] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  secretId: string
  secretKey: string
  projectId: string
}>()

defineEmits<{ close: [] }>()

const { isHistoryEditorOpen, closeDialog } = useUIState()
const secretsStore = useSecretsStore()
const history = ref<EnvironmentHistory[]>([])
const visibleMap = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const allVisible = ref(false)
const activeEnv = ref<Environment | null>(null)

const historyByEnv = computed(() => new Map(history.value.map(env => [env.environment, env])))

const mergedHistory = computed(() => history.value.map(env => ({
  environment: env.environment,
  history: env.history,
  rows: [
    { id: `current-${env.environment}`, value: env.currentValue, isCurrent: true, changedBy: null, changedAt: null },
    ...env.history.map(h => ({ id: h.id, value: h.value, isCurrent: false, changedBy: h.changedBy, changedAt: h.changedAt })),
  ],
})))

const activeHistory = computed(() => mergedHistory.value.find(env => env.environment === activeEnv.value) ?? null)

async function handleCopy(key: string, value: string) {
  if (!value) {
    return
  }

  await navigator.clipboard.writeText(value)
  copyStates.value[key] = true
  setTimeout(() => copyStates.value[key] = false, 1500)
}

function formatChangedAt(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return "Just now"
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

// Get history when dialog opens and reset state when dialog is closed
watch(isHistoryEditorOpen, async (newVal) => {
  if (newVal) {
    if (props.secretId) {
      const data = await secretsStore.getSecretHistory(props.projectId, props.secretId)
      history.value = data || []
      activeEnv.value = history.value[0]?.environment ?? null
    }
  }
  else {
    history.value = []
    visibleMap.value = {}
    copyStates.value = {}
    allVisible.value = false
    activeEnv.value = null
  }
})
</script>

<style scoped>
.history-tab {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  background: transparent;
  color: var(--muted-foreground);
  border: none;
  border-bottom: 2px solid transparent;
  transition:
    color var(--transition),
    border-color var(--transition);
  white-space: nowrap;
}
.history-tab--active {
  color: var(--foreground);
  border-bottom-color: var(--primary);
}
.history-tab:not(.history-tab--active):not(:disabled):hover {
  color: var(--foreground);
}
.history-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
