<template>
  <Dialog :is-open="isHistoryEditorOpen" title="Secret History" @update:is-open="closeDialog('history')">
    <p v-if="secretsStore.loading" class="text-caption">
      Loading history...
    </p>

    <template v-else>
      <Empty v-if="!history || history.length === 0" message="No history available for this secret." icon-name="ph:clock-counter-clockwise-bold" />

      <template v-else>
        <div class="card p-0!">
          <div class="flex flex-row items-center justify-between border-b">
            <div class="flex flex-row overflow-x-auto">
              <button
                v-for="env in mergedHistory" :key="env.environment"
                type="button"
                class="history-tab" :class="activeEnv === env.environment ? 'history-tab--active' : ''"
                @click="activeEnv = env.environment"
              >
                {{ env.environment }}
              </button>
            </div>

            <button type="button" class="btn shrink-0 rounded-none!" :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'" @click="allVisible = !allVisible">
              <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="15" />
              <span class="hidden md:inline">{{ allVisible ? 'Hide all' : 'Reveal all' }}</span>
            </button>
          </div>

          <div v-if="activeHistory" class="scroll-area max-h-[70vh] space-y-2 overflow-y-auto p-2">
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

                <div class="flex flex-row items-center gap-1 text-muted-foreground">
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

const mergedHistory = computed(() => history.value.map(env => ({
  environment: env.environment,
  history: env.history,
  rows: [
    { id: `current-${env.environment}`, value: env.currentValue, isCurrent: true, changedBy: null, changedAt: null },
    ...env.history.map(h => ({ id: h.id, value: h.value, isCurrent: false, changedBy: h.changedBy, changedAt: h.changedAt })),
  ],
})))

const activeHistory = computed(() => mergedHistory.value.find(env => env.environment === activeEnv.value) ?? mergedHistory.value[0] ?? null)

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
  border-right: var(--border-style);
  transition: all var(--transition);
  white-space: nowrap;
}
.history-tab:last-child {
  border-right: none;
}
.history-tab--active {
  background-color: color-mix(in srgb, var(--muted) 30%, transparent);
  color: var(--foreground);
  border-bottom: 2px solid var(--primary);
}
.history-tab:not(.history-tab--active):hover {
  background-color: color-mix(in srgb, var(--muted) 20%, transparent);
}
</style>
