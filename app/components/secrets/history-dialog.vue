<template>
  <Dialog :is-open="isHistoryEditorOpen" title="Secret History" @update:is-open="closeDialog('history')">
    <p v-if="secretsStore.loading" class="text-caption">
      Loading history...
    </p>

    <template v-else>
      <Empty v-if="!history || history.length === 0" message="No history available for this secret." icon-name="ph:clock-counter-clockwise-bold" />

      <template v-else>
        <button class="btn self-end" :aria-label="allVisible ? 'Hide all values' : 'Reveal all values'" @click="allVisible = !allVisible">
          <icon :name="allVisible ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="15" />
          <span>{{ allVisible ? 'Hide all' : 'Reveal all' }}</span>
        </button>

        <div class="scroll-area max-h-[70vh] space-y-3 overflow-y-auto pt-2 pr-2">
          <div v-for="env in mergedHistory" :key="env.environment" class="space-y-2 rounded-lg border p-3">
            <span class="section-label">{{ env.environment }}</span>

            <div v-for="row in env.rows" :key="row.id" class="space-y-1 rounded-lg p-2">
              <div v-if="!row.isCurrent" class="flex items-center justify-between text-muted-foreground">
                <div class="navigation-group">
                  <img :src="row.changedBy?.image || ''" :alt="row.changedBy?.name || 'Unknown'" class="size-4 rounded-full border">
                  <span class="text-xs font-medium">{{ row.changedBy?.name || 'Unknown' }}</span>
                </div>
                <span class="text-xs">{{ formatChangedAt(row.changedAt!) }}</span>
              </div>

              <div class="navigation-group justify-between text-sm">
                <p class="flex flex-row items-center gap-1">
                  <span class="truncate font-mono text-muted-foreground select-none">
                    {{ visibleMap[row.id] || allVisible ? row.value : "•".repeat(row.value?.length || 0) }}
                  </span>
                  <span v-if="row.isCurrent" class="text-caption-success shrink-0 text-xs">Current Value</span>
                </p>

                <div class="navigation-group text-muted-foreground">
                  <button :aria-label="`Toggle visibility for ${row.id}`" @click="visibleMap[row.id] = !visibleMap[row.id]">
                    <icon :name="visibleMap[row.id] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
                  </button>
                  <button :aria-label="`Copy value for ${row.id}`" @click="handleCopy(row.id, row.value)">
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

const mergedHistory = computed(() => history.value.map(env => ({
  environment: env.environment,
  history: env.history,
  rows: [
    { id: `current-${env.environment}`, value: env.currentValue, isCurrent: true, changedBy: null, changedAt: null },
    ...env.history.map(h => ({ id: h.id, value: h.value, isCurrent: false, changedBy: h.changedBy, changedAt: h.changedAt })),
  ],
})))

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
    }
  }
  else {
    history.value = []
    visibleMap.value = {}
    copyStates.value = {}
    allVisible.value = false
  }
})
</script>
