<template>
  <Dialog :is-open="isHistoryEditorOpen" title="Secret History" @update:is-open="closeDialog('history')">
    <p v-if="projectStore.loading" class="text-caption">
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
          <div v-for="env in history" :key="env.environment" class="space-y-2 rounded-lg border p-3">
            <div class="navigation-group">
              <span class="section-label">{{ env.environment }}</span>
            </div>

            <!-- Current value -->
            <div class="space-y-1 rounded-lg bg-success p-2">
              <span class="text-caption-success text-xs! tracking-wide uppercase">Current Value</span>
              <div class="navigation-group justify-between font-mono text-sm">
                <p class="truncate select-none">
                  {{ visibleValues[env.environment] || allVisible ? env.currentValue : "•".repeat(env.currentValue?.length || 0) }}
                </p>
                <div class="navigation-group">
                  <button :aria-label="`Toggle visibility for ${env.environment}`" @click="visibleValues[env.environment] = !visibleValues[env.environment]">
                    <icon :name="visibleValues[env.environment] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
                  </button>
                  <button :aria-label="`Copy value for ${env.environment}`" @click="handleCopy(env.environment, env.currentValue)">
                    <icon :name="copyStates[env.environment] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Change history -->
            <template v-if="env.history && env.history.length > 0">
              <span class="section-label block text-xs!">Change History</span>

              <div v-for="item in env.history" :key="item.id" class="space-y-1 rounded-lg p-2">
                <div class="flex items-center justify-between text-muted-foreground">
                  <div class="navigation-group">
                    <img :src="item.changedBy.image || ''" :alt="item.changedBy.name" class="size-4 rounded-full border">
                    <span class="text-xs font-medium">{{ item.changedBy.name }}</span>
                  </div>
                  <span class="text-xs">{{ formatChangedAt(item.changedAt) }}</span>
                </div>

                <div class="navigation-group justify-between font-mono text-sm">
                  <p class="truncate select-none">
                    {{ visibleHistory[item.id] || allVisible ? item.value : "•".repeat(item.value?.length || 0) }}
                  </p>
                  <div class="navigation-group text-muted-foreground">
                    <button :aria-label="`Toggle visibility for ${item.id}`" @click="visibleHistory[item.id] = !visibleHistory[item.id]">
                      <icon :name="visibleHistory[item.id] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" />
                    </button>
                    <button :aria-label="`Copy value for ${item.id}`" @click="handleCopy(`history-${item.id}`, item.value)">
                      <icon :name="copyStates[`history-${item.id}`] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" />
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <p v-else class="text-caption py-2 text-center">
              No previous changes
            </p>
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
const projectStore = useProjectStore()
const history = ref<EnvironmentHistory[]>([])
const visibleValues = ref<Record<string, boolean>>({})
const visibleHistory = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})
const allVisible = ref(false)

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
      const data = await projectStore.getSecretHistory(props.projectId, props.secretId)
      history.value = data || []
    }
  }
  else {
    history.value = []
    visibleValues.value = {}
    visibleHistory.value = {}
    copyStates.value = {}
    allVisible.value = false
  }
})
</script>
