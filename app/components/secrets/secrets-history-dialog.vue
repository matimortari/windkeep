<template>
  <Dialog :is-open="isOpen" title="Secret History" @update:is-open="emit('close')">
    <p v-if="projectStore.loading" class="text-caption">
      Loading history...
    </p>

    <Empty v-else-if="!projectStore.loading && (!history || history.length === 0)" message="No history available for this secret." icon-name="ph:clock-counter-clockwise-bold" />

    <div v-else class="scroll-area max-h-[70vh] space-y-4 overflow-y-auto pr-2">
      <p v-if="projectStore.errors.getSecretHistory" class="text-caption-danger text-sm">
        {{ projectStore.errors.getSecretHistory }}
      </p>

      <div v-for="env in history" :key="env.environment" class="space-y-2 rounded-lg bg-muted/30 p-2">
        <h4>
          {{ env.environment.charAt(0) + env.environment.slice(1).toLowerCase() }}
        </h4>

        <div class="rounded-lg border-success/20 bg-success/10 p-2">
          <span class="text-caption-success text-sm font-medium">Current Value</span>

          <div class="navigation-group justify-between font-mono text-sm text-muted-foreground">
            <p class="truncate select-none">
              {{ visibleValues[env.environment] ? env.currentValue : "•".repeat(env.currentValue?.length || 0) }}
            </p>

            <div class="navigation-group">
              <button aria-label="Toggle visibility" @click="visibleValues[env.environment] = !visibleValues[env.environment]">
                <icon :name="visibleValues[env.environment] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" class="hover:text-primary" />
              </button>
              <button aria-label="Copy value" @click="handleCopy(env.environment, env.currentValue)">
                <icon :name="copyStates[env.environment] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" class="hover:text-primary" />
              </button>
            </div>
          </div>
        </div>

        <!-- History -->
        <div v-if="env.history && env.history.length > 0" class="space-y-2">
          <h5>
            Change History
          </h5>

          <div v-for="item in env.history" :key="item.id" class="rounded-lg border-muted/20 bg-muted/10 p-2">
            <div class="mb-2 flex items-center justify-between">
              <div class="navigation-group">
                <img :src="item.changedBy.image || ''" :alt="item.changedBy.name" class="size-4 rounded-full border">
                <span class="text-caption">{{ item.changedBy.name }}</span>
              </div>

              <span class="text-caption">{{ formatDate(item.changedAt) }}</span>
            </div>

            <div class="text-caption navigation-group justify-between font-mono">
              <p class="truncate select-none">
                {{ visibleHistory[item.id] ? item.value : "•".repeat(item.value?.length || 0) }}
              </p>

              <div class="navigation-group">
                <button aria-label="Toggle visibility" @click="visibleHistory[item.id] = !visibleHistory[item.id]">
                  <icon :name="visibleHistory[item.id] ? 'ph:eye-closed-bold' : 'ph:eye-bold'" size="20" class="hover:text-primary" />
                </button>
                <button aria-label="Copy value" @click="handleCopy(`history-${item.id}`, item.value)">
                  <icon :name="copyStates[`history-${item.id}`] ? 'ph:check-bold' : 'ph:copy-bold'" size="20" class="hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="text-caption py-4 text-center">
          No previous changes
        </p>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  secretId: string
  secretKey: string
  projectId: string
}>()

const emit = defineEmits<{ close: [] }>()

const projectStore = useProjectStore()
const history = ref<EnvironmentHistory[]>([])
const visibleValues = ref<Record<string, boolean>>({})
const visibleHistory = ref<Record<string, boolean>>({})
const copyStates = ref<Record<string, boolean>>({})

async function fetchHistory() {
  if (!props.isOpen || !props.secretId) {
    return
  }

  try {
    const data = await projectStore.getSecretHistory(props.projectId, props.secretId)
    history.value = data || []
  }
  catch {
    // Silently fail
  }
}

async function handleCopy(key: string, value: string) {
  if (!value) {
    return
  }

  await navigator.clipboard.writeText(value)
  copyStates.value[key] = true
  setTimeout(() => copyStates.value[key] = false, 1500)
}

function formatDate(date: Date | string) {
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

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Reset state when dialog is closed or opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchHistory()
  }
  else {
    history.value = []
    visibleValues.value = {}
    visibleHistory.value = {}
    copyStates.value = {}
  }
})
</script>
